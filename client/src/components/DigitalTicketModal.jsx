import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const DigitalTicketModal = ({ isOpen, onClose, booking }) => {
  const navigate = useNavigate();

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f84464] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">Booking Confirmed!</span>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Card Container (Printable Area) */}
        <div className="p-6 overflow-y-auto space-y-4 printable-ticket bg-[#f8f9fa]">
          <div className="relative rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
            {/* Top Pass Branding */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#f84464] flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-slate-900 text-sm tracking-wider">VENURO M-TICKET</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {booking.bookingStatus || 'CONFIRMED'}
              </span>
            </div>

            {/* Event Info */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                {booking.eventTitle || booking.event?.title || 'Live Event Experience'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#f84464] shrink-0" />
                <span className="font-medium text-slate-700">{booking.venueName || booking.event?.venueName || booking.event?.venue?.name}</span>
              </p>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-dashed border-gray-200 text-xs bg-gray-50/70 p-3 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-[#f84464]" />
                  {booking.showDate || booking.show?.date}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Showtime</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#f84464]" />
                  {booking.showTime || booking.show?.startTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Screen / Audi</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {booking.screenName || booking.show?.screenName || 'Screen 1'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Seats</span>
                <span className="font-extrabold text-[#f84464] font-mono block mt-0.5">
                  {booking.seats?.map(s => s.id).join(', ')}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="pt-2 flex flex-col items-center justify-center text-center">
              {booking.qrCodeImage ? (
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                  <img
                    src={booking.qrCodeImage}
                    alt="Entry QR Ticket"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-slate-400 border border-gray-200">
                  QR Generated
                </div>
              )}

              <p className="text-xs font-mono font-bold text-slate-800 mt-3 tracking-wider">
                Booking ID: {booking.bookingNumber}
              </p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Show this M-Ticket QR at the venue entrance</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/user-dashboard');
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-xs font-bold text-white shadow-md shadow-[#f84464]/20 flex items-center justify-center gap-1.5 transition"
          >
            <span>My Bookings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
