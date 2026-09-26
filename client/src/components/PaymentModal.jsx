import { useState } from 'react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * PaymentModal — Venuro Platform
 *
 * Handles Razorpay checkout (or simulation mode when keys not configured).
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onSuccess: (booking) => void
 *   bookingDetails: { showId, eventId, seatIds, seatsData, grandTotal, totalAmount, convenienceFee, eventTitle, showDate, showTime }
 */
export default function PaymentModal({ isOpen, onClose, onSuccess, bookingDetails }) {
  const { user } = useAuth();
  const [step, setStep] = useState('summary'); // summary | processing | success
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  if (!isOpen || !bookingDetails) return null;

  const {
    showId, eventId, seatIds, seatsData,
    grandTotal = 0, totalAmount = 0, convenienceFee = 0,
    eventTitle = 'Event', showDate, showTime,
  } = bookingDetails;

  // Load Razorpay script dynamically
  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setStep('processing');
    try {
      // Step 1: Create order on backend
      const orderRes = await paymentAPI.createOrder({ showId, eventId, seatIds });
      const { order, razorpayKeyId, simulated } = orderRes.data;

      // Step 2: If simulated (no real Razorpay), use simulation endpoint
      if (simulated || !razorpayKeyId || razorpayKeyId === 'rzp_test_simulation') {
        await handleSimulation(orderRes.data);
        return;
      }

      // Step 3: Real Razorpay checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load payment gateway. Using simulation instead.');
        await handleSimulation(orderRes.data);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Venuro 🎟️',
        description: eventTitle,
        order_id: order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#6c63ff' },
        handler: async (response) => {
          try {
            // Step 4: Verify signature on backend
            const verifyRes = await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              showId, eventId, seatIds,
              seatsData: orderRes.data.seatsData,
              grandTotal: orderRes.data.grandTotal,
              totalAmount: orderRes.data.totalAmount,
              convenienceFee: orderRes.data.convenienceFee,
            });
            setConfirmedBooking(verifyRes.data.booking);
            setStep('success');
            toast.success('Payment successful! 🎉');
            onSuccess?.(verifyRes.data.booking);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
            setStep('summary');
          }
        },
        modal: {
          ondismiss: () => setStep('summary'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => {
        toast.error('Payment failed: ' + (res.error?.description || 'Unknown error'));
        setStep('summary');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
      setStep('summary');
    }
  };

  const handleSimulation = async (orderData) => {
    try {
      const res = await paymentAPI.simulatePayment({
        showId, eventId, seatIds,
        seatsData: orderData?.seatsData || seatsData || seatIds?.map((id, i) => ({
          seatId: id, row: 'A', number: i + 1, type: 'standard',
          price: Math.round((grandTotal || 350) / (seatIds?.length || 1)),
        })),
        grandTotal: orderData?.grandTotal || grandTotal,
        totalAmount: orderData?.totalAmount || totalAmount,
        convenienceFee: orderData?.convenienceFee || convenienceFee,
      });
      setConfirmedBooking(res.data.booking);
      setStep('success');
      toast.success('Booking confirmed! 🎉');
      onSuccess?.(res.data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
      setStep('summary');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {step === 'success' ? '🎉 Booking Confirmed!' : '💳 Complete Payment'}
          </h2>
          {step !== 'processing' && (
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-lg transition">
              ×
            </button>
          )}
        </div>

        <div className="p-6">
          {/* ── SUMMARY STEP ── */}
          {step === 'summary' && (
            <>
              {/* Event Info */}
              <div className="bg-gray-800 rounded-xl p-4 mb-5">
                <h3 className="text-white font-semibold">{eventTitle}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {showDate && `${showDate}`}{showTime && ` · ${showTime}`}
                </p>
                <p className="text-purple-400 text-sm mt-1 font-medium">
                  {seatIds?.length || 1} seat{(seatIds?.length || 1) > 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Subtotal ({seatIds?.length || 1} seats)</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Convenience Fee (5%)</span>
                  <span>₹{convenienceFee}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between font-bold">
                  <span className="text-white">Total Payable</span>
                  <span className="text-green-400 text-xl">₹{grandTotal}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mb-5">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-white text-sm font-medium">100% Secure Payment</p>
                  <p className="text-gray-400 text-xs">UPI · Cards · Net Banking · Wallets via Razorpay</p>
                </div>
              </div>

              <button onClick={handlePay}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-green-900/30">
                Pay ₹{grandTotal} →
              </button>
              <p className="text-gray-600 text-center text-xs mt-3">
                By paying, you agree to Venuro's Terms & Conditions
              </p>
            </>
          )}

          {/* ── PROCESSING STEP ── */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <p className="text-white text-lg font-semibold">Processing Payment...</p>
              <p className="text-gray-400 text-sm mt-2">Please do not close this window</p>
            </div>
          )}

          {/* ── SUCCESS STEP ── */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-7xl mb-4">🎟️</div>
              <h3 className="text-white text-2xl font-bold">You're all set!</h3>
              <p className="text-green-400 text-xl font-bold mt-2">₹{grandTotal} paid</p>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Your e-ticket with QR code is ready.<br />
                {user?.email && <span>Confirmation sent to <span className="text-purple-400">{user.email}</span></span>}
              </p>
              {confirmedBooking?.bookingId && (
                <div className="mt-4 bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Booking ID</p>
                  <p className="text-white font-mono font-medium text-sm">{confirmedBooking.bookingId}</p>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition">
                  Close
                </button>
                <button
                  onClick={() => { onClose(); window.location.href = '/dashboard'; }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-bold transition">
                  View Ticket 🎫
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
