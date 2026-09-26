import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  Filter, 
  Flame, 
  Compass, 
  Film, 
  Music, 
  Trophy, 
  Mic, 
  ChevronRight,
  Star,
  RefreshCw,
  Play
} from 'lucide-react';
import { eventAPI, aiAPI } from '../services/api';
import { EventCard } from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export const HomePage = ({ onOpenAiChat }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentCity = searchParams.get('city') || 'all';

  const categories = [
    { id: 'all', label: 'All Experiences', icon: Compass },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'concerts', label: 'Concerts & Events', icon: Music },
    { id: 'sports', label: 'Live Sports', icon: Trophy },
    { id: 'live-shows', label: 'Plays & Standup', icon: Mic },
    { id: 'experiences', label: 'VR & Activities', icon: Flame },
  ];

  const languages = ['All', 'Hindi', 'English', 'Punjabi', 'Urdu'];

  useEffect(() => {
    fetchEvents();
  }, [currentCategory, currentSearch, currentCity]);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (currentCategory !== 'all') params.category = currentCategory;
      if (currentCity !== 'all') params.city = currentCity;
      if (currentSearch) params.search = currentSearch;

      const res = await eventAPI.getAll(params);
      const list = res?.events || res?.data?.events || (Array.isArray(res) ? res : []);
      setEvents(list);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await aiAPI.getRecommendations();
      const list = res?.recommendations || res?.data?.recommendations;
      if (list && Array.isArray(list)) {
        setRecommendations(list);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCategoryClick = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const filteredByLanguage = selectedLanguage === 'All'
    ? events
    : events.filter(e => e.language?.toLowerCase().includes(selectedLanguage.toLowerCase()));

  const featuredEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-8 pb-16 bg-[#f5f5f7]">
      
      {/* 1. Top Carousel / Featured Hero Banner (BookMyShow Style) */}
      {featuredEvent && !currentSearch && currentCategory === 'all' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#22243a] text-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              {/* Left Details */}
              <div className="p-6 sm:p-10 md:col-span-7 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#f84464] text-white">
                    Featured Premiere
                  </span>
                  <span className="text-xs font-semibold text-gray-300">
                    {featuredEvent.city} • {featuredEvent.venueName}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {featuredEvent.title}
                </h1>

                <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                  {featuredEvent.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-gray-300">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {featuredEvent.rating || '4.9'}/5
                  </span>
                  <span>•</span>
                  <span>{featuredEvent.duration || '2h 30m'}</span>
                  <span>•</span>
                  <span>{featuredEvent.language || 'English / Hindi'}</span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Link
                    to={`/event/${featuredEvent._id}`}
                    className="px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#f84464] hover:bg-[#e23754] text-white shadow-md shadow-red-500/20 transition-all flex items-center gap-2"
                  >
                    <span>Book Tickets</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={onOpenAiChat}
                    className="px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Ask AI About Show</span>
                  </button>
                </div>
              </div>

              {/* Right Image Poster */}
              <div className="relative md:col-span-5 h-48 md:h-80 overflow-hidden bg-black/40">
                <img
                  src={featuredEvent.bannerUrl || featuredEvent.posterUrl}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#22243a] via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Main Catalog Body with BMS Sidebar & Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Filter Pills (BookMyShow Horizontal Bar) */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => {
              const isSelected = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#f84464] text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Language filter pills */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>Language:</span>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  selectedLanguage === lang
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight font-['Space_Grotesk']">
              {currentSearch ? `Search Results for "${currentSearch}"` : 'Recommended Experiences'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Explore trending live concerts, movies, sports, and standup shows with real-time seat locking
            </p>
          </div>
          <span className="text-xs font-bold text-[#f84464] hover:underline cursor-pointer">
            {filteredByLanguage.length} Events Available
          </span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#f84464] animate-spin" />
            <p className="text-xs font-semibold">Loading experiences...</p>
          </div>
        ) : filteredByLanguage.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <Film className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No events found</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your category or city filters, or ask our AI assistant for recommendations.
            </p>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedLanguage('All');
              }}
              className="px-4 py-2 rounded-lg bg-[#f84464] text-white text-xs font-bold hover:bg-[#e23754]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Event Grid (4 columns desktop, 2 columns mobile) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredByLanguage.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}

        {/* 3. Promotional Strip (Like BookMyShow Stream) */}
        <section className="mt-12 bg-gradient-to-r from-[#22243a] to-[#333545] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-gray-900">
              ⚡ Exclusive Tech
            </span>
            <h3 className="text-lg sm:text-2xl font-black font-['Space_Grotesk']">
              Experience Concurrency-Safe Live Seat Booking
            </h3>
            <p className="text-xs text-gray-300 max-w-xl">
              Powered by Redis distributed locking (<code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">SET NX EX 300</code>) to prevent race conditions during high-demand flash sales.
            </p>
          </div>
          <button
            onClick={onOpenAiChat}
            className="px-5 py-2.5 rounded-lg bg-[#f84464] hover:bg-[#e23754] text-white text-xs font-bold shadow-lg shadow-red-500/30 whitespace-nowrap"
          >
            Chat with AI Assistant 🤖
          </button>
        </section>

      </div>
    </div>
  );
};

export default HomePage;
