import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Ticket } from 'lucide-react';

export const EventCard = ({ event }) => {
  return (
    <div className="group flex flex-col rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
      {/* Poster Image */}
      <Link to={`/event/${event._id}`} className="relative aspect-[2/3] overflow-hidden bg-gray-100 block">
        <img
          src={event.posterUrl || event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* BookMyShow Style Rating Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white px-3 py-1.5 flex items-center justify-between text-xs backdrop-blur-xs">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{event.rating || '4.9'}/5</span>
            <span className="text-[11px] text-gray-300 font-normal ml-1">({event.totalReviews || 340} Votes)</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#f84464] bg-white/10 px-1.5 py-0.5 rounded">
            {event.category}
          </span>
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <Link to={`/event/${event._id}`}>
            <h3 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-[#f84464] transition-colors">
              {event.title}
            </h3>
          </Link>
          
          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {event.genre?.join(', ') || 'Entertainment'}
          </p>

          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{event.city} • {event.venueName}</span>
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-gray-700">
            From ₹250
          </span>

          <Link
            to={`/event/${event._id}`}
            className="px-3.5 py-1.5 rounded text-xs font-bold bg-[#f84464] hover:bg-[#e23754] text-white shadow-sm transition-all flex items-center gap-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
