import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ticket, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Calendar, 
  Menu, 
  X,
  Compass,
  Film,
  Music,
  Trophy,
  Mic,
  Flame,
  ChevronDown,
  MapPin,
  Bot,
  Building2
} from 'lucide-react';

export const Navbar = ({ onOpenAiChat }) => {
  const { user, isAuthenticated, logout, isOrganizer, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Pune', 'Goa'];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Movies', path: '/?category=movies', icon: Film },
    { name: 'Concerts & Events', path: '/?category=concerts', icon: Music },
    { name: 'Plays & Theatre', path: '/?category=live-shows', icon: Mic },
    { name: 'Sports', path: '/?category=sports', icon: Trophy },
    { name: 'Activities & VR', path: '/?category=experiences', icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* 1. Main Navigation Bar (BookMyShow Navy #333545) */}
      <div className="bg-[#333545] text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#f84464] flex items-center justify-center shadow-md">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-white font-['Space_Grotesk']">
                venuro
              </span>
              <span className="ml-1 text-[9px] font-bold uppercase tracking-widest px-1 py-0.5 bg-[#f84464] text-white rounded">
                AI
              </span>
            </div>
          </Link>

          {/* Search Bar (BMS Style White Pill) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Search for Movies, Events, Plays, Sports and Activities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs text-gray-800 pl-9 pr-4 py-2 rounded border border-transparent focus:outline-none focus:ring-1 focus:ring-[#f84464] shadow-sm placeholder:text-gray-400 font-medium"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>

          {/* Right Area: City Selector + AI Assistant + User Auth */}
          <div className="flex items-center gap-3">
            {/* City Selector */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-200 hover:text-white px-2 py-1.5 rounded transition-colors"
              >
                <span>{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 text-gray-800">
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCity(c);
                        setCityDropdownOpen(false);
                        navigate(`/?city=${c}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${
                        selectedCity === c ? 'text-[#f84464] font-bold bg-red-50' : 'text-gray-700'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-[#f84464]" />
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ask AI Assistant Button */}
            <button
              onClick={onOpenAiChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-[#f84464] hover:opacity-95 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>

            {/* User Account / Sign In */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#22243a] hover:bg-[#2b2e46] px-2.5 py-1 rounded text-xs border border-gray-700 transition-all"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover border border-[#f84464]"
                  />
                  <span className="font-semibold text-white truncate max-w-[100px]">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 text-gray-800">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-[#f84464] bg-red-50 px-2 py-0.5 rounded">
                        <span>Wallet:</span>
                        <span>₹{user.walletBalance || 2500}</span>
                      </div>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#f84464]"
                    >
                      <Ticket className="w-4 h-4 text-[#f84464]" />
                      <span>My Bookings & QR Passes</span>
                    </Link>

                    {isOrganizer && (
                      <Link
                        to="/organizer/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-700"
                      >
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>Organizer Studio</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-700"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-1.5 rounded text-xs font-bold bg-[#f84464] hover:bg-[#e23754] text-white transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Navigation Ribbon (Clean White #ffffff) */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium text-gray-700">
          <div className="flex items-center space-x-6 py-2.5 overflow-x-auto scrollbar-none">
            <Link
              to="/"
              className={`hover:text-[#f84464] transition-colors ${
                location.pathname === '/' && !location.search ? 'text-[#f84464] font-bold border-b-2 border-[#f84464] pb-2 -mb-2.5' : ''
              }`}
            >
              All Events
            </Link>
            {navLinks.map((link) => {
              const isActive = location.pathname + location.search === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`hover:text-[#f84464] transition-colors whitespace-nowrap ${
                    isActive ? 'text-[#f84464] font-bold border-b-2 border-[#f84464] pb-2 -mb-2.5' : ''
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Utility Links */}
          <div className="flex items-center space-x-5 text-[11px] text-gray-500 font-medium">
            <Link to="/organizer/login" className="hover:text-gray-900 transition">ListYourShow</Link>
            <span className="hover:text-gray-900 cursor-pointer">Corporates</span>
            <span className="hover:text-gray-900 cursor-pointer">Offers</span>
            <span className="hover:text-gray-900 cursor-pointer">Gift Cards</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-3 text-xs text-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded bg-gray-50 hover:bg-red-50 hover:text-[#f84464] font-semibold"
            >
              All Events
            </Link>
            {navLinks.map((l) => (
              <Link
                key={l.name}
                to={l.path}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded bg-gray-50 hover:bg-red-50 hover:text-[#f84464] font-semibold"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
