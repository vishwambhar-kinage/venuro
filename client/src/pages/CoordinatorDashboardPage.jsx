import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  ScanLine, 
  DollarSign, 
  Ticket, 
  Users, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  MapPin,
  Clock,
  RefreshCw
} from 'lucide-react';
import { eventAPI, showAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QrScannerModal } from '../components/QrScannerModal';

export const CoordinatorDashboardPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showModalEvent, setShowModalEvent] = useState(null);

  // New Event Form State
  const [newEventData, setNewEventData] = useState({
    title: '',
    category: 'concerts',
    city: 'Mumbai',
    venueName: '',
    address: '',
    duration: '2h 30m',
    language: 'English / Hindi',
    ageLimit: '13+',
    cast: 'Headliner Artist, Live Band',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
    description: ''
  });

  // New Show Form State
  const [newShowData, setNewShowData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '19:30',
    endTime: '22:00',
    screenName: 'Main Arena / Audi 1'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchCoordinatorEvents();
  }, []);

  const fetchCoordinatorEvents = async () => {
    setLoading(true);
    try {
      const res = await eventAPI.getCoordinatorEvents();
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load coordinator events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setStatusMessage('');

    try {
      const payload = {
        ...newEventData,
        cast: newEventData.cast.split(',').map((s) => s.trim()),
        genre: [newEventData.category, 'Entertainment']
      };

      const res = await eventAPI.create(payload);
      if (res.success) {
        setStatusMessage('🎉 Event and initial showtimes created successfully!');
        await fetchCoordinatorEvents();
        setTimeout(() => {
          setCreateModalOpen(false);
          setStatusMessage('');
        }, 1200);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateShowSubmit = async (e) => {
    e.preventDefault();
    if (!showModalEvent) return;
    setFormLoading(true);

    try {
      const res = await showAPI.createShow({
        ...newShowData,
        eventId: showModalEvent._id
      });

      if (res.success) {
        setStatusMessage('✅ Showtime slot published successfully!');
        setTimeout(() => {
          setShowModalEvent(null);
          setStatusMessage('');
        }, 1200);
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const totalTicketsSold = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);

  return (
    <div className="bg-[#f5f5f7] min-h-screen py-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Banner & Coordinator Profile */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                🎪 Event Coordinator Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#22243a]">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Publish events, manage show schedules, track live ticket sales & verify QR passes at venue gates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setScannerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <ScanLine className="w-4 h-4" />
              <span>Gate QR Scanner</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Event</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#f84464]" />
              Active Events Managed
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#22243a] font-mono">{events.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-emerald-600" />
              Total Tickets Sold
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">{totalTicketsSold}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Gross Revenue
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#22243a] font-mono">₹{totalRevenue}</p>
          </div>
        </div>

        {/* Managed Events List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-lg font-bold text-[#22243a]">Your Published Experiences</h2>
            <span className="text-xs text-slate-500 font-medium">{events.length} Live in Catalog</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#f84464] animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Loading coordinator records...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center max-w-md mx-auto space-y-3 border border-gray-200 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#22243a]">No events published yet</h3>
              <p className="text-xs text-slate-500">Click "Publish New Event" to launch your first show!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <div key={evt._id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    <img src={evt.bannerUrl} alt={evt.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f84464] text-white shadow-sm">
                      {evt.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 line-clamp-1">{evt.title}</h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{evt.city} • {evt.venueName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Tickets Sold</span>
                        <span className="font-extrabold text-emerald-600 font-mono">{evt.ticketsSold || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Revenue</span>
                        <span className="font-extrabold text-slate-900 font-mono">₹{evt.revenue || 0}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                      <button
                        onClick={() => setShowModalEvent(evt)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slot</span>
                      </button>

                      <a
                        href={`/event/${evt._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#f84464] border border-rose-200 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-4">
              <h3 className="text-lg font-bold text-[#22243a]">Create New Entertainment Event</h3>
              
              {statusMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleCreateEventSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coldplay: Music of the Spheres Live"
                      value={newEventData.title}
                      onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900 focus:outline-none focus:border-[#f84464]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Category *</label>
                    <select
                      value={newEventData.category}
                      onChange={(e) => setNewEventData({ ...newEventData, category: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900 focus:outline-none focus:border-[#f84464]"
                    >
                      <option value="movies">Movies</option>
                      <option value="concerts">Concerts</option>
                      <option value="sports">Sports</option>
                      <option value="live-shows">Live Shows</option>
                      <option value="experiences">Experiences</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai, Bengaluru, Delhi-NCR"
                      value={newEventData.city}
                      onChange={(e) => setNewEventData({ ...newEventData, city: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Venue Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DY Patil Stadium, PVR INOX"
                      value={newEventData.venueName}
                      onChange={(e) => setNewEventData({ ...newEventData, venueName: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Venue Full Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, City, Landmark, Postal Code"
                    value={newEventData.address}
                    onChange={(e) => setNewEventData({ ...newEventData, address: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Duration</label>
                    <input
                      type="text"
                      value={newEventData.duration}
                      onChange={(e) => setNewEventData({ ...newEventData, duration: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Language</label>
                    <input
                      type="text"
                      value={newEventData.language}
                      onChange={(e) => setNewEventData({ ...newEventData, language: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Age Rating</label>
                    <input
                      type="text"
                      value={newEventData.ageLimit}
                      onChange={(e) => setNewEventData({ ...newEventData, ageLimit: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cast / Performers (Comma-separated)</label>
                  <input
                    type="text"
                    value={newEventData.cast}
                    onChange={(e) => setNewEventData({ ...newEventData, cast: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    value={newEventData.bannerUrl}
                    onChange={(e) => setNewEventData({ ...newEventData, bannerUrl: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detailed synopsis and highlights..."
                    value={newEventData.description}
                    onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={formLoading}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-slate-700 font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold shadow-md shadow-[#f84464]/20 transition"
                  >
                    {formLoading ? 'Publishing...' : 'Publish Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Showtime Modal */}
        {showModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-[#22243a]">
                Add Showtime Slot for {showModalEvent.title}
              </h3>

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleCreateShowSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newShowData.date}
                    onChange={(e) => setNewShowData({ ...newShowData, date: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={newShowData.startTime}
                      onChange={(e) => setNewShowData({ ...newShowData, startTime: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={newShowData.endTime}
                      onChange={(e) => setNewShowData({ ...newShowData, endTime: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Screen / Audi Name</label>
                  <input
                    type="text"
                    value={newShowData.screenName}
                    onChange={(e) => setNewShowData({ ...newShowData, screenName: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModalEvent(null)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-slate-700 font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold transition"
                  >
                    Publish Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {scannerOpen && (
          <QrScannerModal
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
