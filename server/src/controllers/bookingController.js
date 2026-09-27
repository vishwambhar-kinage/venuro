import { dataStore } from '../models/dataStore.js';
import { lockSeat, unlockSeat, unlockAllUserSeats, RedisLockService } from '../services/redisLockService.js';
import { generateBookingQR, verifyQR, QRService } from '../services/qrService.js';
import { io } from '../server.js';

export const lockSeats = async (req, res) => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user._id;

    if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid showId and seatIds array.' });
    }

    const show = dataStore.findShowById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    // Check if any seat is already booked permanently
    for (const seatId of seatIds) {
      let isBooked = false;
      show.seatGrid.forEach(row => {
        const found = row.find(s => s.id === seatId);
        if (found && found.status === 'booked') {
          isBooked = true;
        }
      });

      if (isBooked) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatId} has already been permanently booked by another guest.`
        });
      }
    }

    // Attempt Redis lock
    const lockResult = await RedisLockService.acquireSeatLocks(showId, seatIds, userId, 300);

    if (!lockResult.success) {
      return res.status(409).json({
        success: false,
        message: lockResult.message,
        failedSeats: lockResult.failedSeats
      });
    }

    // Broadcast seat locked event to all clients watching this show room
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        type: 'LOCKED',
        seatIds,
        userId,
        ttlSeconds: 300
      });
    }

    res.json({
      success: true,
      message: 'Seats locked exclusively for 5 minutes!',
      lockedSeats: lockResult.lockedSeats,
      ttlSeconds: 300
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const releaseSeats = async (req, res) => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user._id;

    if (!showId || !seatIds || !Array.isArray(seatIds)) {
      return res.status(400).json({ success: false, message: 'Please provide showId and seatIds.' });
    }

    const result = await RedisLockService.releaseSeatLocks(showId, seatIds, userId);

    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        type: 'RELEASED',
        seatIds: result.released
      });
    }

    res.json({
      success: true,
      message: 'Seat locks released',
      releasedSeats: result.released
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { showId, seatIds, paymentMethod = 'UPI', promoCode = '' } = req.body;
    const userId = req.user._id;

    if (!showId || !seatIds || !seatIds.length) {
      return res.status(400).json({ success: false, message: 'Please select valid seats to book.' });
    }

    const show = dataStore.findShowById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    const event = dataStore.findEventById(show.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Find seat details and calculate price
    const selectedSeatDetails = [];
    let baseTotal = 0;

    for (const seatId of seatIds) {
      let seatObj = null;
      show.seatGrid.forEach(row => {
        const found = row.find(s => s.id === seatId);
        if (found) seatObj = found;
      });

      if (!seatObj) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist.` });
      }

      if (seatObj.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} has already been booked.` });
      }

      selectedSeatDetails.push(seatObj);
      baseTotal += seatObj.price;
    }

    // Apply promo discounts
    let discount = 0;
    if (promoCode && promoCode.toUpperCase() === 'VENURO20') {
      discount = Math.round(baseTotal * 0.20);
    } else if (promoCode && promoCode.toUpperCase() === 'FIRSTSHOW') {
      discount = Math.min(150, Math.round(baseTotal * 0.50));
    }

    const convenienceFee = Math.round(35 * seatIds.length);
    const finalAmount = Math.max(0, baseTotal - discount + convenienceFee);

    // Generate temp booking object to build cryptographic QR Code
    const tempBooking = {
      _id: `bkg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      bookingNumber: `VNR-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      finalAmount,
      seats: selectedSeatDetails
    };

    const qrPayload = QRService.createTicketPayload(tempBooking, event, show);
    const qrCodeImage = await QRService.generateQRCodeDataUrl(qrPayload);

    // Save actual booking
    const booking = dataStore.createBooking({
      _id: tempBooking._id,
      bookingNumber: tempBooking.bookingNumber,
      userId,
      eventId: event._id,
      showId: show._id,
      seats: selectedSeatDetails,
      totalAmount: baseTotal,
      discountAmount: discount,
      convenienceFee,
      finalAmount,
      paymentDetails: {
        paymentId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        method: paymentMethod,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      },
      qrCodeData: qrPayload,
      qrCodeImage
    });

    // Mark seats permanently booked in the show seat grid
    show.seatGrid.forEach(row => {
      row.forEach(s => {
        if (seatIds.includes(s.id)) {
          s.status = 'booked';
        }
      });
    });

    // Update show available seat count
    show.availableSeats = Math.max(0, show.availableSeats - seatIds.length);

    // Release Redis temporary locks
    await RedisLockService.releaseSeatLocks(showId, seatIds, userId);

    // Real-time broadcast that seats are now booked
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        type: 'BOOKED',
        seatIds
      });
    }

    res.status(201).json({
      success: true,
      message: '🎉 Booking confirmed successfully! Digital QR Ticket generated.',
      booking: {
        ...booking,
        eventTitle: event.title,
        venueName: event.venueName,
        bannerUrl: event.bannerUrl,
        showDate: show.date,
        showTime: show.startTime,
        screenName: show.screenName
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = dataStore.getBookingsForUser(userId);

    const enriched = bookings.map(b => {
      const event = dataStore.findEventById(b.eventId);
      const show = dataStore.findShowById(b.showId);
      return {
        ...b,
        event: event ? {
          title: event.title,
          category: event.category,
          bannerUrl: event.bannerUrl,
          posterUrl: event.posterUrl,
          venueName: event.venueName,
          city: event.city
        } : null,
        show: show ? {
          date: show.date,
          startTime: show.startTime,
          screenName: show.screenName
        } : null
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      bookings: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = dataStore.findBookingById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Role check: Admin, Coordinator, or Booking owner
    if (req.user.role === 'user' && booking.userId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const event = dataStore.findEventById(booking.eventId);
    const show = dataStore.findShowById(booking.showId);

    res.json({
      success: true,
      booking: {
        ...booking,
        event,
        show
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer requested refund' } = req.body;
    const booking = dataStore.findBookingById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'user' && booking.userId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
    }

    const show = dataStore.findShowById(booking.showId);
    
    // Dynamic refund calculation
    // If show is > 24 hours away = 100%, 4-24h = 70%, <4h = 0%
    let refundPercentage = 1.0;
    if (show) {
      const showDateTime = new Date(`${show.date}T${show.startTime}:00`).getTime();
      const now = Date.now();
      const diffHours = (showDateTime - now) / (1000 * 60 * 60);

      if (diffHours > 24) {
        refundPercentage = 1.0;
      } else if (diffHours > 4) {
        refundPercentage = 0.70;
      } else {
        refundPercentage = 0.0;
      }
    }

    const refundAmount = Math.round(booking.totalAmount * refundPercentage);

    // Cancel booking record
    dataStore.cancelBooking(booking._id, reason, refundAmount);

    // Credit user's wallet
    const user = dataStore.findUserById(booking.userId);
    if (user && refundAmount > 0) {
      user.walletBalance = (user.walletBalance || 0) + refundAmount;
    }

    // Free up the seats in the show seat matrix
    if (show) {
      const seatIds = booking.seats.map(s => s.id);
      show.seatGrid.forEach(row => {
        row.forEach(s => {
          if (seatIds.includes(s.id)) {
            s.status = 'available';
          }
        });
      });
      show.availableSeats = Math.min(show.totalSeats, show.availableSeats + seatIds.length);

      if (io) {
        io.to(`show_${show._id}`).emit('seats_updated', {
          type: 'RELEASED',
          seatIds
        });
      }
    }

    res.json({
      success: true,
      message: `Booking cancelled successfully! Refund of ₹${refundAmount} (${refundPercentage * 100}%) credited to Venuro Wallet.`,
      refundAmount,
      refundPercentage: `${refundPercentage * 100}%`,
      booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyTicketScan = async (req, res) => {
  try {
    const { qrPayload, qrData, bookingId, bookingNumber } = req.body;
    let payload = qrPayload;

    if (!payload && (bookingId || bookingNumber)) {
      const bkg = dataStore.findBookingById(bookingId || bookingNumber);
      if (bkg && bkg.qrCodeData) {
        payload = bkg.qrCodeData;
      }
    }

    if (!payload && qrData) {
      const v = verifyQR(qrData);
      if (v && v.valid) {
        const bkg = dataStore.findBookingById(v.bookingId);
        if (bkg) payload = bkg.qrCodeData;
      }
    }

    const verification = payload ? QRService.verifyTicketPayload(payload) : { valid: false, message: 'Missing QR ticket payload' };

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: verification.message || 'Invalid or unverified ticket QR signature'
      });
    }

    const booking = dataStore.findBookingById(verification.payload.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Ticket signature valid, but booking record not found in system.'
      });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        valid: false,
        status: 'CANCELLED',
        message: '❌ INVALID ENTRY: This ticket was CANCELLED and refunded.'
      });
    }

    res.json({
      success: true,
      valid: true,
      status: 'VERIFIED',
      message: '✅ VALID TICKET: Admission Approved!',
      ticket: {
        bookingNumber: booking.bookingNumber,
        eventTitle: verification.payload.eventTitle,
        venue: verification.payload.venue,
        date: verification.payload.date,
        time: verification.payload.time,
        seats: verification.payload.seats,
        admitCount: verification.payload.seats?.length || 1,
        status: booking.bookingStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
