import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Wallet, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Printer, 
  Sparkles,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';
import { bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const UserDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getMyBookings();
      const list = res?.bookings || res?.data?.bookings || (Array.isArray(res) ? res : []);
      setBookings(list);
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setCancelMessage('');

    try {
      const res = await bookingAPI.cancelBooking(cancelModalBooking._id, 'Customer cancellation via dashboard');
      if (res.success) {
        setCancelMessage(res.message);
        await refreshUser();
        await fetchUserBookings();
        setTimeout(() => {
          setCancelModalBooking(null);
          setCancelMessage('');
        }, 1800);
      }
    } catch (err) {
      setCancelMessage(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-[#f5f5f7] min-h-screen py-8 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Overview Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#f84464] bg-gray-50 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#22243a]">{user?.name}</h1>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#f84464] border border-rose-200">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user?.preferences?.map((pref, idx) => (
                  <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-slate-600 border border-gray-200">
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Venuro Wallet Balance Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#333545] to-[#22243a] text-white shadow-md flex items-center justify-between gap-6 min-w-[280px]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-[#f84464]">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">Venuro Wallet</span>
                <span className="text-2xl font-black text-white font-mono">₹{user?.walletBalance || 0}</span>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-300 max-w-[100px] leading-tight">
              Instant refund credits & express checkout
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#22243a]">Your Bookings & Digital M-Tickets</h2>
              <p className="text-xs text-slate-500">View verified QR passes or process instant cancellations with auto-refunds</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-gray-200 shadow-sm">
              {bookings.length} Total Bookings
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#f84464] animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Retrieving your passes...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center max-w-md mx-auto space-y-4 border border-gray-200 shadow-sm">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#22243a]">No active bookings yet</h3>
              <p className="text-xs text-slate-500">
                Explore trending movies, live concerts, and sports matches to experience instant seat booking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => {
                const isCancelled = booking.bookingStatus === 'CANCELLED';

                return (
                  <div
                    key={booking._id}
                    className={`relative rounded-2xl overflow-hidden bg-white border transition-all shadow-sm hover:shadow-md ${
                      isCancelled ? 'border-red-200 opacity-75' : 'border-gray-200 hover:border-[#f84464]/50'
                    }`}
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Header: Title & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            isCancelled
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {booking.bookingStatus}
                          </span>
                          <h3 className="font-extrabold text-base text-slate-900 mt-1.5 line-clamp-1">
                            {booking.event?.title || 'Entertainment Event'}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {booking.event?.venueName || booking.event?.venue?.name || 'Venuro Audi'}
                          </p>
                        </div>

                        {/* QR Thumbnail */}
                        {booking.qrCodeImage && (
                          <div
                            onClick={() => setSelectedTicket(booking)}
                            className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                            title="Click to view full M-Ticket"
                          >
                            <img
                              src={booking.qrCodeImage}
                              alt="Ticket QR"
                              className="w-14 h-14 object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Booking Meta */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Time</span>
                          <span className="font-bold text-slate-800">
                            {booking.show?.date} @ {booking.show?.startTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Seats ({booking.seats?.length})</span>
                          <span className="font-extrabold text-[#f84464] font-mono">
                            {booking.seats?.map(s => s.id).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking No.</span>
                          <span className="font-mono text-slate-700 text-[11px] truncate block">
                            {booking.bookingNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                          <span className="font-bold text-slate-900 font-mono">
                            ₹{booking.finalAmount}
                          </span>
                        </div>
                      </div>

                      {/* Cancellation details if cancelled */}
                      {isCancelled && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-0.5">
                          <p className="font-bold">Refund Processed: ₹{booking.refundAmount}</p>
                          <p className="text-[11px] text-red-600">Credited to your Venuro Wallet balance.</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                        <button
                          onClick={() => setSelectedTicket(booking)}
                          className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Ticket className="w-3.5 h-3.5 text-[#f84464]" />
                          <span>View M-Ticket</span>
                        </button>

                        {!isCancelled && (
                          <button
                            onClick={() => setCancelModalBooking(booking)}
                            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition"
                          >
                            Cancel & Refund
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancellation Confirmation Modal */}
        {cancelModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Cancel Booking</h3>
                  <p className="text-xs text-slate-500">{cancelModalBooking.event?.title}</p>
                </div>
              </div>

              {cancelMessage ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center">
                  {cancelMessage}
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-slate-700 space-y-2">
                    <p className="font-bold text-slate-900">Refund Policy Breakdown:</p>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      <li>• &gt; 24 hrs before show: <strong>100% full refund</strong></li>
                      <li>• 4 - 24 hrs before show: <strong>70% refund</strong></li>
                      <li>• &lt; 4 hrs before show: <strong>Non-refundable</strong></li>
                    </ul>
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-slate-900">
                      <span>Original Paid:</span>
                      <span className="font-mono text-[#f84464]">₹{cancelModalBooking.finalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setCancelModalBooking(null)}
                      disabled={cancelling}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold transition"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      disabled={cancelling}
                      className="px-4 py-2 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white text-xs font-bold shadow-md shadow-[#f84464]/20 flex items-center gap-1.5 transition"
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Digital Pass Modal */}
        {selectedTicket && (
          <DigitalTicketModal
            isOpen={!!selectedTicket}
            onClose={() => setSelectedTicket(null)}
            booking={selectedTicket}
          />
        )}
      </div>
    </div>
  );
};
