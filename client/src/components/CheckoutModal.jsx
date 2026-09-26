import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  ShieldCheck, 
  Tag, 
  Lock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CheckoutModal = ({
  isOpen,
  onClose,
  show,
  event,
  selectedSeats,
  onBookingSuccess
}) => {
  const { user, refreshUser } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const baseTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length * 35;
  const finalTotal = Math.max(0, baseTotal - discountAmount + convenienceFee);

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'VENURO20') {
      const disc = Math.round(baseTotal * 0.20);
      setDiscountAmount(disc);
      setPromoApplied(true);
    } else if (code === 'FIRSTSHOW') {
      const disc = Math.min(150, Math.round(baseTotal * 0.50));
      setDiscountAmount(disc);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid promo code. Try VENURO20 or FIRSTSHOW.');
    }
  };

  const handlePayAndConfirm = async () => {
    setProcessing(true);
    setErrorMsg('');

    try {
      const bookingData = {
        showId: show._id,
        seatIds: selectedSeats.map((s) => s.id),
        paymentMethod,
        promoCode: promoApplied ? promoCode : ''
      };

      const res = await bookingAPI.checkout(bookingData);
      const booking = res?.booking || res?.data?.booking;
      if (booking) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}

        if (refreshUser) await refreshUser();
        onBookingSuccess(booking);
      } else {
        setErrorMsg('Booking could not be finalized. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#333545] text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Booking Summary</h3>
            <p className="text-xs text-slate-300">{event.title} • {show.screenName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-[#f84464] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Show summary */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Showtime & Date</p>
              <p className="text-sm font-bold text-slate-900">{show.date} @ {show.startTime}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Seats ({selectedSeats.length})</p>
              <p className="text-sm font-bold text-[#f84464] font-mono">
                {selectedSeats.map((s) => s.id).join(', ')}
              </p>
            </div>
          </div>

          {/* Promo code input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#f84464]" />
                <span>Apply Promo Code</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Use VENURO20 or FIRSTSHOW</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoApplied}
                className="flex-1 bg-white text-xs text-slate-900 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#f84464] uppercase placeholder:normal-case font-mono"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoApplied || !promoCode.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#333545] hover:bg-[#22243a] text-white disabled:opacity-50 transition"
              >
                {promoApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {promoApplied && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Coupon applied! Saved ₹{discountAmount}
              </p>
            )}
            {promoError && <p className="text-[11px] text-red-500 mt-1 font-medium">{promoError}</p>}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'CARD', label: 'Credit/Debit', icon: CreditCard },
                { id: 'NETBANKING', label: 'Net Banking', icon: Building2 },
                { id: 'WALLET', label: 'Venuro Wallet', icon: Wallet },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-[#f84464] text-[#f84464] shadow-sm'
                        : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-[#f84464]' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold block">{method.label}</span>
                      {method.id === 'WALLET' && (
                        <span className="text-[10px] text-emerald-600 block font-mono font-semibold">₹{user?.walletBalance || 0}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Price Breakdown */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Ticket Fare ({selectedSeats.length} seats)</span>
              <span className="font-mono font-semibold text-slate-800">₹{baseTotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Promo Discount</span>
                <span className="font-mono">-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Convenience Fee (incl. GST)</span>
              <span className="font-mono font-semibold text-slate-800">₹{convenienceFee}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Amount Payable</span>
              <span className="text-[#f84464] font-mono text-base font-extrabold">₹{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">100% Safe & Secure</span>
          </div>

          <button
            onClick={handlePayAndConfirm}
            disabled={processing}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-[#f84464] hover:bg-[#d83552] text-white shadow-md shadow-[#f84464]/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Ticket...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Pay ₹{finalTotal}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
