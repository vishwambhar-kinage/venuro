import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Timer, 
  MapPin, 
  Calendar, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { showAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SeatMatrix } from '../components/SeatMatrix';
import { CheckoutModal } from '../components/CheckoutModal';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const SeatBookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [show, setShow] = useState(null);
  const [event, setEvent] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockingLoading, setLockingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lock state
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch initial seat matrix
  useEffect(() => {
    fetchSeatData();
  }, [showId]);

  // Real-time socket room synchronization
  useEffect(() => {
    if (!socket || !showId) return;

    socket.emit('join_show', showId);

    const handleSeatsUpdated = (data) => {
      console.log('📡 [Live Seat Broadcast]:', data);
      // Refresh seat grid overlay
      fetchSeatData(false);
    };

    socket.on('seats_updated', handleSeatsUpdated);

    return () => {
      socket.emit('leave_show', showId);
      socket.off('seats_updated', handleSeatsUpdated);
    };
  }, [socket, showId]);

  // Lock countdown timer
  useEffect(() => {
    let interval = null;
    if (isLockedByMe && lockSecondsRemaining > 0) {
      interval = setInterval(() => {
        setLockSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Lock expired!
            setIsLockedByMe(false);
            setSelectedSeats([]);
            setCheckoutModalOpen(false);
            setErrorMsg('Your 5-minute temporary seat lock has expired. Please select seats again.');
            fetchSeatData(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedByMe, lockSecondsRemaining]);

  const fetchSeatData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await showAPI.getSeatMap(showId);
      if (res.success) {
        setShow(res.show);
        setEvent(res.event);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load seat layout.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleToggleSeat = (seat) => {
    setErrorMsg('');
    const exists = selectedSeats.some((s) => s.id === seat.id);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
      if (isLockedByMe) {
        bookingAPI.releaseSeats(showId, [seat.id]).catch(() => {});
      }
    } else {
      if (selectedSeats.length >= 8) {
        setErrorMsg('You can select a maximum of 8 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleProceedToLockAndCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(`/book/${showId}`));
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMsg('Please select at least 1 seat to proceed.');
      return;
    }

    setLockingLoading(true);
    setErrorMsg('');

    try {
      const res = await bookingAPI.lockSeats(
        showId,
        selectedSeats.map((s) => s.id)
      );

      if (res.success) {
        setIsLockedByMe(true);
        setLockSecondsRemaining(res.ttlSeconds || 300);
        setCheckoutModalOpen(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not acquire temporary lock for seats. Please try different seats.');
      fetchSeatData(false);
    } finally {
      setLockingLoading(false);
    }
  };

  const handleBookingSuccess = (newBooking) => {
    setConfirmedBooking(newBooking);
    setCheckoutModalOpen(false);
    setIsLockedByMe(false);
    setLockSecondsRemaining(0);
    setSelectedSeats([]);
    setTicketModalOpen(true);
    fetchSeatData(false);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 space-y-3 bg-[#f5f5f7]">
        <div className="w-10 h-10 border-3 border-[#f84464] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Connecting to live seat matrix & Redis lock engine...</p>
      </div>
    );
  }

  if (!show || !event) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#22243a]">Showtime Not Found</h2>
        <Link to="/" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#f84464] hover:bg-[#d83552] text-white text-xs font-bold transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f7] min-h-screen pb-24">
      {/* Top Header Bar — BookMyShow Clean Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/event/${event._id}`)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 transition"
              title="Back to Event Details"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-[#22243a] text-base sm:text-lg flex items-center gap-2">
                <span>{event.title}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-slate-600 border border-gray-200">
                  {event.ageRating || 'UA'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-medium text-slate-700">{event.venue?.name || show.screenName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#f84464]" />
                  {show.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#f84464]" />
                  {show.startTime}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Redis Live Sync Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#f84464] shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Interactive Seat Matrix Component */}
        <SeatMatrix
          show={show}
          event={event}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          isLockedByMe={isLockedByMe}
          lockSecondsRemaining={lockSecondsRemaining}
          onProceedCheckout={handleProceedToLockAndCheckout}
          lockingLoading={lockingLoading}
        />

        {/* Checkout Modal */}
        {checkoutModalOpen && (
          <CheckoutModal
            isOpen={checkoutModalOpen}
            onClose={() => setCheckoutModalOpen(false)}
            show={show}
            event={event}
            selectedSeats={selectedSeats}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* Digital Ticket Modal */}
        {ticketModalOpen && confirmedBooking && (
          <DigitalTicketModal
            isOpen={ticketModalOpen}
            onClose={() => setTicketModalOpen(false)}
            booking={confirmedBooking}
          />
        )}
      </div>
    </div>
  );
};
