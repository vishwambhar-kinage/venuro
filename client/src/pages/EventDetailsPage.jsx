import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  Ticket, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft,
  Share2,
  Heart
} from 'lucide-react';
import { eventAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const EventDetailsPage = ({ onOpenAiChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [shows, setShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await eventAPI.getById(id);
      const data = res?.event || res?.data?.event || res;
      if (data && data._id) {
        setEvent(data);
        const shws = res?.shows || res?.data?.shows || [];
        setShows(shws);
        setReviews(res?.reviews || res?.data?.reviews || []);

        if (shws.length > 0) {
          setSelectedDate(shws[0].date);
        }
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-gray-500 space-y-3 bg-[#f5f5f7]">
        <div className="w-10 h-10 border-3 border-[#f84464] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading showtimes and experience details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 bg-[#f5f5f7]">
        <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
        <p className="text-xs text-gray-500">The event you are looking for does not exist or has concluded.</p>
        <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f84464] text-white text-xs font-bold shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const uniqueDates = Array.from(new Set(shows.map(s => s.date))).sort();
  const filteredShows = shows.filter(s => s.date === selectedDate);

  return (
    <div className="space-y-6 pb-20 bg-[#f5f5f7]">
      
      {/* 1. Dark Backdrop Hero (BookMyShow Movie Header Style) */}
      <section className="bg-[#1f2533] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            
            {/* Poster Thumbnail */}
            <div className="relative w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">
              <img
                src={event.posterUrl || event.bannerUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[10px] uppercase font-bold bg-[#f84464] text-white px-2 py-0.5 rounded">
                In Cinemas
              </span>
            </div>

            {/* Event Overview */}
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#f84464] bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                  {event.category}
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                  {event.title}
                </h1>
              </div>

              {/* BMS Rating Box */}
              <div className="bg-[#2b3144] p-3 rounded-xl border border-gray-700/60 max-w-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  <div>
                    <span className="text-base font-extrabold text-white">{event.rating || '4.9'}/5</span>
                    <span className="text-[11px] text-gray-400 block">({event.totalReviews || 890} Verified Votes)</span>
                  </div>
                </div>
                <button
                  onClick={onOpenAiChat}
                  className="px-3 py-1.5 rounded bg-[#f84464] hover:bg-[#e23754] text-white text-xs font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Review</span>
                </button>
              </div>

              {/* Format & Details pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-300">
                <span className="bg-gray-800 px-2.5 py-1 rounded text-white font-bold">2D, 3D, IMAX 3D, 4DX</span>
                <span className="bg-gray-800 px-2.5 py-1 rounded">{event.language || 'English / Hindi'}</span>
                <span>•</span>
                <span>{event.duration || '2h 30m'}</span>
                <span>•</span>
                <span className="text-gray-300">{event.genre?.join(', ')}</span>
                <span>•</span>
                <span>{event.ageLimit || '13+'}</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                {event.description}
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-4 h-4 text-[#f84464]" />
                <span>{event.venueName}, {event.city}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Main Showtimes & Booking Section (Clean White Area) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Date Selector Ribbon (BookMyShow Style Horizontal Date Buttons) */}
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            {uniqueDates.map((dateStr, idx) => {
              const d = new Date(dateStr);
              const dayName = idx === 0 ? 'TODAY' : idx === 1 ? 'TOMORROW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
              const dayNum = d.getDate();
              const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-4 py-2 rounded-lg text-center transition-all flex flex-col items-center min-w-[72px] ${
                    isSelected
                      ? 'bg-[#f84464] text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wider">{dayName}</span>
                  <span className="text-base font-black leading-tight">{dayNum}</span>
                  <span className="text-[10px] uppercase font-semibold">{monthName}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Fast Filling</span>
          </div>
        </div>

        {/* Cinema / Venue Showtimes Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">{event.venueName}</h3>
              <p className="text-xs text-gray-500">{event.address}</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              M-Ticket & Food Available
            </span>
          </div>

          {/* Show Slots List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredShows.length > 0 ? (
              filteredShows.map((shw) => (
                <div
                  key={shw._id}
                  className="p-3.5 rounded-lg border border-gray-200 hover:border-[#f84464] bg-gray-50/50 hover:bg-red-50/20 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-gray-900 font-mono group-hover:text-[#f84464] transition-colors">
                        {shw.startTime}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                        {shw.screenName}
                      </span>
                    </div>

                    {/* Pricing preview */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {shw.pricingTiers?.map((pt, pIdx) => (
                        <span key={pIdx} className="text-[10px] text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {pt.tier}: <strong>₹{pt.price}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/book/${shw._id}`}
                    className="w-full py-2 rounded text-xs font-bold bg-[#f84464] hover:bg-[#e23754] text-white text-center shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Select Seats</span>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 col-span-3 text-center">
                No shows scheduled for the selected date. Please choose another date.
              </p>
            )}
          </div>
        </div>

        {/* Cast & Crew Section */}
        {event.cast && event.cast.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f84464]" />
              <span>Cast & Crew</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.cast.map((actor, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-800">
                  {actor}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventDetailsPage;
