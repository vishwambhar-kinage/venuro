import { createRazorpayOrder, verifyRazorpaySignature, isRazorpayReady } from '../services/razorpayService.js';
import { generateBookingQR } from '../services/qrService.js';
import { unlockAllUserSeats } from '../services/redisLockService.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';
import { dataStore } from '../models/dataStore.js';
import { io } from '../server.js';

const isMongoConnected = () => !!dataStore.useMongoose;
let _Booking, _Show, _Event, _User;
const getMongoModels = async () => {
  if (!isMongoConnected()) return { Booking: null, Show: null, Event: null, User: null };
  if (!_Booking) {
    try {
      _Booking = (await import('../models/Booking.js')).default;
      _Show = (await import('../models/Show.js')).default;
      _Event = (await import('../models/Event.js')).default;
      _User = (await import('../models/User.js')).default;
    } catch { return { Booking: null, Show: null, Event: null, User: null }; }
  }
  return { Booking: _Booking, Show: _Show, Event: _Event, User: _User };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order (or simulated order) for the selected seats
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentOrder = async (req, res) => {
  try {
    const { showId, seatIds, eventId } = req.body;
    if (!showId || !seatIds?.length)
      return res.status(400).json({ success: false, message: 'Show ID and seat IDs are required.' });

    const userId = (req.user._id || req.user.id).toString();

    // Calculate amounts from selected seats
    let seatsData = [];
    let totalAmount = 0;

    const { Show } = await getMongoModels();
    if (Show) {
      const show = await Show.findById(showId);
      if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

      for (const seatId of seatIds) {
        const seat = show.seats.find(s => s._id.toString() === seatId || `${s.row}${s.number}` === seatId);
        if (seat) {
          seatsData.push({ seatId: seat._id.toString(), row: seat.row, number: seat.number, type: seat.type, price: seat.price });
          totalAmount += seat.price;
        }
      }
    } else {
      // In-memory fallback
      const show = dataStore.findShowById(showId);
      if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

      for (const seatId of seatIds) {
        const seat = show.seats?.find(s => s.id === seatId || `${s.row}${s.number}` === seatId);
        if (seat) {
          seatsData.push({ seatId: seat.id || seatId, row: seat.row, number: seat.number, type: seat.type || 'standard', price: seat.price || 350 });
          totalAmount += seat.price || 350;
        }
      }
      // If no seats found in show, use defaults
      if (!seatsData.length) {
        seatsData = seatIds.map((id, i) => ({ seatId: id, row: 'A', number: i + 1, type: 'standard', price: 350 }));
        totalAmount = seatIds.length * 350;
      }
    }

    const convenienceFee = Math.round(totalAmount * 0.05); // 5% fee
    const grandTotal = totalAmount + convenienceFee;
    const receipt = `vnr_${userId.slice(-6)}_${Date.now()}`;

    const order = await createRazorpayOrder({
      amount: grandTotal,
      receipt,
      notes: { userId, showId, eventId, seats: seatIds.join(',') },
    });

    return res.json({
      success: true,
      order,
      totalAmount,
      convenienceFee,
      grandTotal,
      seatsData,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulation',
      simulated: !isRazorpayReady(),
    });
  } catch (err) {
    console.error('[Payment] createOrder error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay signature → creates Booking → generates QR → sends email
// ─────────────────────────────────────────────────────────────────────────────
export const verifyAndConfirmPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
      showId, eventId, seatIds, seatsData,
      grandTotal, totalAmount, convenienceFee,
    } = req.body;

    const user = req.user;
    const userId = (user._id || user.id).toString();

    // Step 1: Verify Razorpay signature (HMAC-SHA256)
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' });
    }

    // Step 2: Create Booking record
    let booking;
    let bookingId;

    const bookingPayload = {
      user: userId,
      event: eventId,
      show: showId,
      seats: seatsData || seatIds?.map((id, i) => ({ seatId: id, row: 'A', number: i + 1, type: 'standard', price: Math.round(grandTotal / (seatIds?.length || 1)) })),
      totalAmount: totalAmount || grandTotal,
      convenienceFee: convenienceFee || 0,
      grandTotal,
      status: 'confirmed',
      payment: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
        paidAt: new Date(),
      },
    };

    const { Booking, Show, User } = await getMongoModels();
    if (Booking) {
      booking = await Booking.create(bookingPayload);
      bookingId = booking._id.toString();

      // Mark seats as booked in Show document
      if (Show && seatIds?.length) {
        const seatObjectIds = (seatsData || []).map(s => s.seatId);
        await Show.updateOne(
          { _id: showId },
          {
            $set: { 'seats.$[elem].status': 'booked' },
            $inc: { availableSeats: -seatIds.length },
          },
          { arrayFilters: [{ 'elem._id': { $in: seatObjectIds } }] }
        );
      }

      // Update user booking count
      if (User) {
        await User.findByIdAndUpdate(userId, { $inc: { bookingsCount: 1 } });
      }
    } else {
      // In-memory fallback
      booking = dataStore.createBooking({ ...bookingPayload, id: `BK${Date.now()}` });
      bookingId = booking.id;

      // Mark seats in dataStore
      const show = dataStore.findShowById(showId);
      if (show?.seats) {
        (seatsData || []).forEach(sd => {
          const seat = show.seats.find(s => s.id === sd.seatId);
          if (seat) seat.status = 'booked';
        });
      }
    }

    // Step 3: Generate QR code ticket
    const { qrCode, qrData } = await generateBookingQR(bookingId, userId, showId);
    if (Booking && booking._id) {
      await Booking.findByIdAndUpdate(booking._id, { qrCode, qrData });
    } else if (booking) {
      booking.qrCode = qrCode;
      booking.qrData = qrData;
    }

    // Step 4: Release Redis seat locks
    await unlockAllUserSeats(showId, userId);

    // Step 5: Emit real-time event to other users viewing same show
    io.to(`show_${showId}`).emit('seats_booked', { seatIds, bookedAt: new Date() });

    // Step 6: Send confirmation email (non-blocking, fire & forget)
    const { Event } = await getMongoModels();
    const eventData = Event
      ? await Event.findById(eventId).lean().catch(() => null)
      : dataStore.findEventById?.(eventId);

    sendBookingConfirmationEmail({
      email: user.email,
      userName: user.name,
      eventTitle: eventData?.title || 'Your Event',
      bookingId,
      seats: (seatsData || seatIds || []).length,
      grandTotal,
      showDate: new Date().toLocaleDateString('en-IN'),
      showTime: '—',
    }).catch(() => {}); // Don't fail booking if email fails

    return res.json({
      success: true,
      message: 'Payment confirmed! Your booking is ready.',
      booking: {
        ...(booking.toJSON ? booking.toJSON() : booking),
        qrCode,
        bookingId,
      },
    });
  } catch (err) {
    console.error('[Payment] verify error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/simulate
// Demo mode — creates a real booking without actual Razorpay transaction
// ─────────────────────────────────────────────────────────────────────────────
export const simulatePayment = async (req, res) => {
  // Inject fake Razorpay IDs and delegate to verifyAndConfirmPayment
  req.body.razorpayOrderId = `order_sim_${Date.now()}`;
  req.body.razorpayPaymentId = `pay_sim_${Date.now()}`;
  req.body.razorpaySignature = `sig_sim_${Date.now()}`;
  return verifyAndConfirmPayment(req, res);
};
