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
  RefreshCw,
  Send,
  Building2,
  Tag,
  FileText,
  AlertTriangle,
  X,
  ChevronRight
} from 'lucide-react';
import { eventAPI, showAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QrScannerModal } from '../components/QrScannerModal';
import toast from 'react-hot-toast';

export const OrganizerDashboardPage = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'create'
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showModalEvent, setShowModalEvent] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // New Event Form State with Ticket Categories
  const [newEventData, setNewEventData] = useState({
    title: '',
    category: 'concerts',
    city: 'Mumbai',
    venueName: '',
    address: '',
    duration: '2h 30m',
    language: 'English / Hindi',
    ageLimit: '13+',
    cast: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:30',
    endTime: '22:00',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600',
    description: '',
    terms: 'Tickets once booked cannot be exchanged or refunded. Entry allowed up to 30 minutes before showtime.',
    contactEmail: user?.email || '',
    contactPhone: '',
    vipPrice: 2999,
    vipCapacity: 50,
    premiumPrice: 1799,
    premiumCapacity: 150,
    regularPrice: 899,
    regularCapacity: 300
  });

  // Showtime Slot Form State
  const [newShowData, setNewShowData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '19:30',
    endTime: '22:00',
    screenName: 'Main Arena / Audi 1'
  });

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  const fetchOrganizerEvents = async () => {
    setLoading(true);
    try {
      const res = await eventAPI.getMyEvents();
      const list = res?.events || res?.data?.events || [];
      setEvents(list);
    } catch (err) {
      console.error('Failed to load organizer events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e, shouldSubmitForApproval = false) => {
    if (e) e.preventDefault();
    setFormLoading(true);
    setStatusMessage('');

    try {
      const ticketCategories = [
        { name: 'VIP', price: Number(newEventData.vipPrice) || 2999, capacity: Number(newEventData.vipCapacity) || 50, available: Number(newEventData.vipCapacity) || 50 },
        { name: 'Premium', price: Number(newEventData.premiumPrice) || 1799, capacity: Number(newEventData.premiumCapacity) || 150, available: Number(newEventData.premiumCapacity) || 150 },
        { name: 'Regular', price: Number(newEventData.regularPrice) || 899, capacity: Number(newEventData.regularCapacity) || 300, available: Number(newEventData.regularCapacity) || 300 }
      ];

      const payload = {
        title: newEventData.title,
        category: newEventData.category,
        city: newEventData.city,
        venueName: newEventData.venueName,
        address: newEventData.address || `${newEventData.venueName}, ${newEventData.city}`,
        duration: newEventData.duration,
        language: newEventData.language,
        ageLimit: newEventData.ageLimit,
        cast: typeof newEventData.cast === 'string' ? newEventData.cast.split(',').map(s => s.trim()).filter(Boolean) : newEventData.cast,
        date: newEventData.date,
        startTime: newEventData.startTime,
        endTime: newEventData.endTime,
        bannerUrl: newEventData.bannerUrl,
        posterUrl: newEventData.posterUrl,
        description: newEventData.description,
        terms: newEventData.terms,
        contactEmail: newEventData.contactEmail || user?.email,
        contactPhone: newEventData.contactPhone,
        ticketCategories,
        capacity: ticketCategories.reduce((s, c) => s + c.capacity, 0),
        submitForApproval: shouldSubmitForApproval
      };

      const res = await eventAPI.create(payload);
      if (res.success) {
        toast.success(shouldSubmitForApproval ? 'Event submitted for Admin Approval!' : 'Draft event saved successfully!');
        await fetchOrganizerEvents();
        setActiveTab('events');
        // Reset form
        setNewEventData(prev => ({ ...prev, title: '', venueName: '', description: '' }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save event.';
      toast.error(msg);
      setStatusMessage(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitForApproval = async (eventId) => {
    try {
      const res = await eventAPI.submitForApproval(eventId);
      if (res.success) {
        toast.success('Event submitted to Admin for approval queue!');
        fetchOrganizerEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed.');
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this event? Customers will no longer be able to book.')) return;
    try {
      const res = await eventAPI.cancel(eventId);
      if (res.success) {
        toast.success('Event marked as CANCELLED.');
        fetchOrganizerEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Cancellation failed.');
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
        toast.success('Showtime slot added successfully!');
        setShowModalEvent(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add showtime.');
    } finally {
      setFormLoading(false);
    }
  };

  const totalTicketsSold = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  const publishedCount = events.filter(e => ['PUBLISHED', 'APPROVED', 'active'].includes(e.status)).length;
  const pendingCount = events.filter(e => e.status === 'PENDING_APPROVAL').length;
  const draftCount = events.filter(e => e.status === 'DRAFT').length;

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED':
      case 'APPROVED':
      case 'ACTIVE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Published Live</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Under Review</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-slate-700 border border-gray-300">Draft</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-[#f5f5f7] min-h-screen py-8 pb-24 text-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Organizer Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Organizer Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {user?.organizationName || 'Live Events Partner'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#22243a]">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create and manage your entertainment events, submit drafts for Admin approval, and scan admission passes.
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
              onClick={() => setActiveTab('create')}
              className="px-4 py-2.5 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-[#22243a] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Studio Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'events'
                ? 'bg-[#22243a] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            My Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'create'
                ? 'bg-[#22243a] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            + Create Event
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#f84464]" />
                  Total Events
                </span>
                <p className="text-2xl font-extrabold text-[#22243a] font-mono">{events.length}</p>
                <span className="text-[10px] text-slate-400 block">{publishedCount} live, {pendingCount} pending</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Published & Live
                </span>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono">{publishedCount}</p>
                <span className="text-[10px] text-emerald-600 font-semibold block">Visible to customers</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending Approval
                </span>
                <p className="text-2xl font-extrabold text-amber-600 font-mono">{pendingCount}</p>
                <span className="text-[10px] text-amber-700 font-semibold block">In admin review queue</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  Tickets Sold
                </span>
                <p className="text-2xl font-extrabold text-[#22243a] font-mono">{totalTicketsSold}</p>
                <span className="text-[10px] text-slate-400 block">Across all showtimes</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Gross Sales
                </span>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono">₹{totalRevenue}</p>
                <span className="text-[10px] text-emerald-600 font-semibold block">Total ticket turnover</span>
              </div>
            </div>

            {/* Quick Action Strip */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-[#22243a]">Have a new show or concert to host?</h3>
                <p className="text-xs text-slate-500">Create a draft event, configure VIP/Premium seat pricing, and submit for Admin review.</p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white text-xs font-bold transition shadow-sm"
              >
                + Launch Event Workflow
              </button>
            </div>

            {/* Recent Events Preview Table */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-extrabold text-base text-[#22243a]">Your Event Performance</h2>
                <button onClick={() => setActiveTab('events')} className="text-xs text-[#f84464] font-bold hover:underline">
                  View All &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5">Event</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">City & Venue</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Tickets Sold</th>
                      <th className="py-2.5">Gross Revenue</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700">
                    {events.slice(0, 5).map((evt) => (
                      <tr key={evt._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                          <img src={evt.posterUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
                          <span>{evt.title}</span>
                        </td>
                        <td className="py-3 uppercase font-semibold text-[10px] text-slate-500">{evt.category}</td>
                        <td className="py-3 text-slate-600">{evt.city} • {evt.venueName}</td>
                        <td className="py-3">{getStatusBadge(evt.status)}</td>
                        <td className="py-3 font-mono font-bold text-slate-800">{evt.ticketsSold || 0}</td>
                        <td className="py-3 font-mono font-bold text-emerald-600">₹{evt.revenue || 0}</td>
                        <td className="py-3 text-right space-x-2">
                          {evt.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForApproval(evt._id)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] transition"
                            >
                              Submit
                            </button>
                          )}
                          <a
                            href={`/event/${evt._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-[10px] inline-block transition"
                          >
                            Preview
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Events Management */}
        {activeTab === 'events' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#22243a]">All Hosted Events ({events.length})</h2>
                <p className="text-xs text-slate-500">Manage event lifecycles: draft, submit for review, publish, and schedule slots.</p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 text-[#f84464] animate-spin" />
                <p className="text-xs font-semibold text-slate-600">Loading your events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-[#22243a]">No events created yet</h3>
                <p className="text-xs text-slate-500">Create your first event draft to begin selling tickets on Venuro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt) => (
                  <div key={evt._id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                      <img src={evt.bannerUrl} alt={evt.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(evt.status)}
                      </div>
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#333545] text-white">
                        {evt.category}
                      </span>
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{evt.title}</h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{evt.city} • {evt.venueName}</p>
                      </div>

                      {evt.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                          <span className="font-bold block">Rejection Note:</span>
                          <span className="text-[11px]">{evt.rejectionReason}</span>
                        </div>
                      )}

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

                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {evt.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSubmitForApproval(evt._id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit for Approval</span>
                          </button>
                        )}

                        {evt.status === 'PENDING_APPROVAL' && (
                          <div className="flex-1 py-1.5 px-3 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-semibold text-center border border-amber-200">
                            ⏳ Waiting for Admin Review
                          </div>
                        )}

                        {['PUBLISHED', 'APPROVED', 'ACTIVE'].includes(evt.status?.toUpperCase()) && (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => setShowModalEvent(evt)}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Slot</span>
                            </button>
                            <button
                              onClick={() => handleCancelEvent(evt._id)}
                              className="py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs transition"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        <a
                          href={`/event/${evt._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#f84464] border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition"
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
        )}

        {/* Tab 3: Create Event Form */}
        {activeTab === 'create' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-extrabold text-[#22243a]">Publish New Entertainment Experience</h2>
              <p className="text-xs text-slate-500">Provide full event metadata, seating configuration, and ticket pricing.</p>
            </div>

            {statusMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {statusMessage}
              </div>
            )}

            <form onSubmit={(e) => handleCreateEvent(e, false)} className="space-y-6 text-xs">
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[#22243a] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#f84464]" />
                  <span>1. Event Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Venuro Music Festival Live"
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
                      <option value="concerts">Concert / Live Music</option>
                      <option value="movies">Movie / Premiere</option>
                      <option value="sports">Sports Match</option>
                      <option value="live-shows">Comedy & Theatre</option>
                      <option value="experiences">Activities & VR</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune, Mumbai, Bengaluru"
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
                      placeholder="e.g. Balewadi Stadium"
                      value={newEventData.venueName}
                      onChange={(e) => setNewEventData({ ...newEventData, venueName: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Venue Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, Landmark, City, State, PIN"
                    value={newEventData.address}
                    onChange={(e) => setNewEventData({ ...newEventData, address: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={newEventData.date}
                      onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={newEventData.startTime}
                      onChange={(e) => setNewEventData({ ...newEventData, startTime: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEventData.endTime}
                      onChange={(e) => setNewEventData({ ...newEventData, endTime: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Categories Configuration */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-extrabold text-sm text-[#22243a] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>2. Ticket Tiers & Capacity Configuration</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  {/* VIP */}
                  <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="font-extrabold text-purple-700 block">VIP Tier</span>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Price (₹)</label>
                      <input
                        type="number"
                        value={newEventData.vipPrice}
                        onChange={(e) => setNewEventData({ ...newEventData, vipPrice: e.target.value })}
                        className="w-full p-1.5 rounded border border-gray-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Seat Capacity</label>
                      <input
                        type="number"
                        value={newEventData.vipCapacity}
                        onChange={(e) => setNewEventData({ ...newEventData, vipCapacity: e.target.value })}
                        className="w-full p-1.5 rounded border border-gray-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Premium */}
                  <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="font-extrabold text-rose-700 block">Premium Tier</span>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Price (₹)</label>
                      <input
                        type="number"
                        value={newEventData.premiumPrice}
                        onChange={(e) => setNewEventData({ ...newEventData, premiumPrice: e.target.value })}
                        className="w-full p-1.5 rounded border border-gray-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Seat Capacity</label>
                      <input
                        type="number"
                        value={newEventData.premiumCapacity}
                        onChange={(e) => setNewEventData({ ...newEventData, premiumCapacity: e.target.value })}
                        className="w-full p-1.5 rounded border border-gray-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Regular */}
                  <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="font-extrabold text-blue-700 block">Regular Tier</span>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Price (₹)</label>
                      <input
                        type="number"
                        value={newEventData.regularPrice}
                        onChange={(e) => setNewEventData({ ...newEventData, regularPrice: e.target.value })}
                        className="w-full p-1.5 rounded border border-gray-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Seat Capacity</label>
                      <input
                        type="number"
                        value={newEventData.regularCapacity}
                        onChange={(e) => setNewEventData({ ...newEventData, regularCapacity: e.target.value })}
                        className="w-full p-1.5 rounded border border-gray-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Media & Details */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-extrabold text-sm text-[#22243a]">3. Media & Description</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="font-bold text-slate-700 block mb-1">Poster Image URL</label>
                    <input
                      type="text"
                      value={newEventData.posterUrl}
                      onChange={(e) => setNewEventData({ ...newEventData, posterUrl: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cast / Performers (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Artist, Opening Act, Live Orchestra"
                    value={newEventData.cast}
                    onChange={(e) => setNewEventData({ ...newEventData, cast: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Description & Highlights *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Full synopsis, stage details, parking info..."
                    value={newEventData.description}
                    onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Terms & Conditions</label>
                  <input
                    type="text"
                    value={newEventData.terms}
                    onChange={(e) => setNewEventData({ ...newEventData, terms: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-xl border border-gray-300 text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('events')}
                  disabled={formLoading}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold transition"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCreateEvent(e, true)}
                  disabled={formLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold shadow-md shadow-[#f84464]/20 flex items-center gap-1.5 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit for Admin Approval</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Showtime Slot Modal */}
        {showModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-extrabold text-[#22243a]">
                Add Showtime Slot for {showModalEvent.title}
              </h3>

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

export default OrganizerDashboardPage;
