import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Ticket, 
  DollarSign, 
  Activity, 
  Cpu, 
  Database, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Eye,
  Settings,
  Sparkles,
  Building2,
  AlertTriangle,
  Clock,
  Search,
  Check,
  X,
  Plus
} from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [organizersList, setOrganizersList] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'approvals' | 'organizers' | 'users' | 'bookings' | 'system'
  const [rejectModalEvent, setRejectModalEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [addOrganizerModal, setAddOrganizerModal] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', email: '', password: '', organizationName: '', phone: '' });

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, orgsRes, pendingRes, bookingsRes, healthRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getUsers(),
        adminAPI.getOrganizers(),
        adminAPI.getPendingEvents(),
        adminAPI.getBookings(),
        adminAPI.getHealth()
      ]);

      if (analyticsRes?.metrics || analyticsRes?.success) setAnalytics(analyticsRes);
      if (usersRes?.users || usersRes?.success) setUsersList(usersRes.users || []);
      if (orgsRes?.organizers || orgsRes?.success) setOrganizersList(orgsRes.organizers || []);
      if (pendingRes?.events || pendingRes?.success) setPendingEvents(pendingRes.events || []);
      if (bookingsRes?.bookings || bookingsRes?.success) setAllBookings(bookingsRes.bookings || []);
      if (healthRes?.system || healthRes?.success) setSystemHealth(healthRes.system || healthRes);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      const res = await adminAPI.approveEvent(eventId);
      if (res.success) {
        toast.success('Event APPROVED and published to customer catalog!');
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Approval failed.');
    }
  };

  const handleRejectEventSubmit = async () => {
    if (!rejectModalEvent) return;
    try {
      const res = await adminAPI.rejectEvent(rejectModalEvent._id, rejectionReason);
      if (res.success) {
        toast.success('Event marked as REJECTED with feedback.');
        setRejectModalEvent(null);
        setRejectionReason('');
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Rejection failed.');
    }
  };

  const handleToggleOrganizerStatus = async (orgId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminAPI.updateOrganizerStatus(orgId, newStatus);
      if (res.success) {
        toast.success(`Organizer status updated to ${newStatus.toUpperCase()}`);
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Status update failed.');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await adminAPI.toggleUserStatus(userId);
      if (res.success) {
        toast.success(res.message);
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'User status update failed.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await adminAPI.updateUserRole(userId, newRole);
      if (res.success) {
        toast.success(`User role updated to ${newRole.toUpperCase()}`);
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Role update failed.');
    }
  };

  const handleCreateOrganizerSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createOrganizer(newOrgData);
      if (res.success) {
        toast.success('Organizer account created successfully!');
        setAddOrganizerModal(false);
        setNewOrgData({ name: '', email: '', password: '', organizationName: '', phone: '' });
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create organizer.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 space-y-3 bg-[#f5f5f7]">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-700">Loading platform command center & telemetry...</p>
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const categoryRev = analytics?.categoryRevenue || {};

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const filteredBookings = allBookings.filter(b => {
    return !bookingSearch || b.bookingNumber.toLowerCase().includes(bookingSearch.toLowerCase()) || b.user?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) || b.event?.title?.toLowerCase().includes(bookingSearch.toLowerCase());
  });

  return (
    <div className="bg-[#f5f5f7] min-h-screen py-8 pb-24 text-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header Bar */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                Admin Command Center
              </span>
              {pendingEvents.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {pendingEvents.length} Pending Event Approvals
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#22243a]">
              Platform Governance & Security
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-role approvals, organizer onboarding, financial audits, Redis lock status, and vector AI health.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-gray-100 border border-gray-200 self-start md:self-auto text-xs font-bold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'approvals', label: `Approvals (${pendingEvents.length})` },
              { id: 'organizers', label: `Organizers (${organizersList.length})` },
              { id: 'users', label: `Users (${usersList.length})` },
              { id: 'bookings', label: `Bookings (${allBookings.length})` },
              { id: 'system', label: 'System Health' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#22243a] shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                  <span>Gross Platform GMV</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#22243a] font-mono">₹{metrics.totalGMV || 0}</p>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Net: ₹{metrics.netRevenue || 0} (₹{metrics.totalRefunds || 0} refunded)
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                  <span>Total Confirmed Bookings</span>
                  <Ticket className="w-4 h-4 text-[#f84464]" />
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#22243a] font-mono">{metrics.totalBookings || 0}</p>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {metrics.totalTicketsSold || 0} total tickets issued
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                  <span>Verified Organizers</span>
                  <Building2 className="w-4 h-4 text-amber-600" />
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#22243a] font-mono">{organizersList.length}</p>
                <span className="text-[10px] text-amber-700 font-bold block">
                  {metrics.totalEvents || 0} hosted events catalog
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                  <span>Pending Approval Queue</span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono">
                  {pendingEvents.length}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Awaiting administrator review
                </span>
              </div>
            </div>

            {/* Revenue Distribution */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-[#22243a]">
                Revenue Distribution by Entertainment Category
              </h2>

              <div className="space-y-3">
                {[
                  { label: 'Movies & IMAX 3D', key: 'movies', color: 'bg-blue-600' },
                  { label: 'Concerts & Stadiums', key: 'concerts', color: 'bg-[#f84464]' },
                  { label: 'Live Sports Matches', key: 'sports', color: 'bg-emerald-600' },
                  { label: 'Comedy & Plays', key: 'live-shows', color: 'bg-amber-500' },
                  { label: 'VR & Experiences', key: 'experiences', color: 'bg-purple-600' },
                ].map((item) => {
                  const amount = categoryRev[item.key] || 0;
                  const pct = metrics.totalGMV > 0 ? Math.round((amount / metrics.totalGMV) * 100) : 0;

                  return (
                    <div key={item.key} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="text-slate-900 font-mono font-bold">₹{amount} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Event Approval Queue */}
        {activeTab === 'approvals' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-200 pb-3">
              <h2 className="text-lg font-extrabold text-[#22243a]">Pending Event Approvals ({pendingEvents.length})</h2>
              <p className="text-xs text-slate-500">Review events submitted by organizers before they go live on customer catalog.</p>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-[#22243a]">Approval Queue Clean!</h3>
                <p className="text-xs text-slate-500">All submitted events have been reviewed and published.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEvents.map((evt) => (
                  <div key={evt._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img src={evt.posterUrl} alt="" className="w-16 h-20 rounded-xl object-cover border border-gray-300 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              Pending Review
                            </span>
                            <span className="text-xs uppercase font-bold text-slate-400">{evt.category}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 mt-1">{evt.title}</h3>
                          <p className="text-xs text-slate-600">
                            <strong>Organizer:</strong> {evt.organizerName || 'Partner'} • <strong>Venue:</strong> {evt.venueName}, {evt.city}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <strong>Schedule:</strong> {evt.date} @ {evt.startTime} • <strong>Language:</strong> {evt.language}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => setRejectModalEvent(evt)}
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleApproveEvent(evt._id)}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-1">
                      <p className="font-bold text-slate-700">Event Description:</p>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{evt.description}</p>
                    </div>

                    {/* Ticket categories preview */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {evt.ticketCategories?.map((tier, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 font-medium text-slate-700">
                          <strong>{tier.name}:</strong> ₹{tier.price} ({tier.capacity} seats)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Organizer Management */}
        {activeTab === 'organizers' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#22243a]">Organizer Partners ({organizersList.length})</h2>
                <p className="text-xs text-slate-500">View partner sales, track event performance, and authorize new accounts.</p>
              </div>
              <button
                onClick={() => setAddOrganizerModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Organizer</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5">Organizer</th>
                    <th className="py-2.5">Organization</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Hosted Events</th>
                    <th className="py-2.5">Tickets Sold</th>
                    <th className="py-2.5">Gross Revenue</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700">
                  {organizersList.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                        <img src={org.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200" />
                        <div>
                          <div>{org.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{org.email}</div>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{org.organizationName}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          org.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-800">{org.totalEvents} ({org.publishedEvents} live)</td>
                      <td className="py-3 font-mono font-bold text-slate-800">{org.totalTicketsSold}</td>
                      <td className="py-3 font-mono font-bold text-emerald-600">₹{org.totalRevenue}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleOrganizerStatus(org.id, org.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            org.status === 'active'
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {org.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: User Management */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#22243a]">Platform User Accounts ({filteredUsers.length})</h2>
                <p className="text-xs text-slate-500">Manage authorization roles and activate/deactivate user access.</p>
              </div>

              {/* Search & Role Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search user name/email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-white text-xs px-3 py-1.5 rounded-lg border border-gray-300"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 font-semibold"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Wallet</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Change Role</th>
                    <th className="py-2.5 text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                        <img src={u.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200" />
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 font-mono font-bold text-emerald-600">₹{u.walletBalance || 0}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-white text-slate-800 px-2 py-1 rounded border border-gray-300 text-xs font-semibold"
                        >
                          <option value="customer">Customer</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            u.status === 'active'
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Bookings Audit */}
        {activeTab === 'bookings' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#22243a]">Platform Transactions Audit ({filteredBookings.length})</h2>
                <p className="text-xs text-slate-500">Real-time audit log of customer tickets, HMAC signatures, and payment states.</p>
              </div>
              <input
                type="text"
                placeholder="Search booking no. or customer..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="bg-white text-xs px-3 py-1.5 rounded-lg border border-gray-300 w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5">Booking ID</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Event</th>
                    <th className="py-2.5">Seats</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#22243a]">{b.bookingNumber}</td>
                      <td className="py-3">
                        <div className="font-bold text-slate-800">{b.user?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.user?.email}</div>
                      </td>
                      <td className="py-3 font-medium text-slate-800">{b.event?.title}</td>
                      <td className="py-3 font-mono font-bold text-[#f84464]">{b.seats?.length} Seats</td>
                      <td className="py-3 font-mono font-bold text-slate-900">₹{b.finalAmount}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          b.bookingStatus === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-600">{b.paymentMethod} • {b.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: System Health */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#22243a] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <span>Node.js Engine Status & Memory</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                  <span className="text-slate-600 font-medium">System Overall Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> HEALTHY & ONLINE
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                  <span className="text-slate-600 font-medium">Memory Usage (RSS)</span>
                  <span className="font-bold text-slate-800 font-mono">{systemHealth?.memoryUsageMB} MB</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                  <span className="text-slate-600 font-medium">Process Uptime</span>
                  <span className="font-bold text-slate-800 font-mono">{systemHealth?.uptimeSeconds}s</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#22243a] flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Redis Distributed Locks & AI Engine</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                  <span className="text-slate-600 font-medium">Redis Concurrency Locks</span>
                  <span className="font-bold text-emerald-600">ONLINE (SET NX EX 300)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                  <span className="text-slate-600 font-medium">Vector Semantic Dimensions</span>
                  <span className="font-bold text-[#f84464] font-mono">256 Cosine Embeddings</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                  <span className="text-slate-600 font-medium">Active Seat Locks in Cache</span>
                  <span className="font-bold text-amber-600 font-mono">{systemHealth?.redis?.activeSeatLocks || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Reject Event Submission</h3>
              </div>
              <p className="text-xs text-slate-500">
                Specify the reason for rejection so the organizer can fix and resubmit.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Venue capacity details missing, poster image resolution too low..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-slate-900"
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectModalEvent(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectEventSubmit}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Organizer Modal */}
        {addOrganizerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-extrabold text-[#22243a]">Provision New Organizer Partner</h3>

              <form onSubmit={handleCreateOrganizerSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Verma"
                    value={newOrgData.name}
                    onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organization / Production Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LiveNation India Pvt Ltd"
                    value={newOrgData.organizationName}
                    onChange={(e) => setNewOrgData({ ...newOrgData, organizationName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organizer Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="partner@livenation.com"
                    value={newOrgData.email}
                    onChange={(e) => setNewOrgData({ ...newOrgData, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newOrgData.password}
                    onChange={(e) => setNewOrgData({ ...newOrgData, password: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={newOrgData.phone}
                    onChange={(e) => setNewOrgData({ ...newOrgData, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setAddOrganizerModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/20"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
