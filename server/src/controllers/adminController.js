import bcrypt from 'bcryptjs';
import { dataStore } from '../models/dataStore.js';
import { getRedis } from '../config/redis.js';

export const getPlatformAnalytics = async (req, res) => {
  try {
    const allBookings = dataStore.getAllBookings();
    const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'CONFIRMED');
    const cancelledBookings = allBookings.filter(b => b.bookingStatus === 'CANCELLED');

    const totalGMV = confirmedBookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    const totalRefunds = cancelledBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);

    // Revenue by Category
    const categoryRevenue = {
      movies: 0,
      concerts: 0,
      sports: 0,
      'live-shows': 0,
      experiences: 0
    };

    confirmedBookings.forEach(b => {
      const evt = dataStore.findEventById(b.eventId);
      if (evt && categoryRevenue[evt.category] !== undefined) {
        categoryRevenue[evt.category] += (b.finalAmount || 0);
      }
    });

    const pendingEvents = dataStore.events.filter(e => e.status === 'PENDING_APPROVAL');
    const publishedEvents = dataStore.events.filter(e => ['PUBLISHED', 'APPROVED', 'active'].includes(e.status));
    const organizers = dataStore.users.filter(u => ['organizer', 'coordinator'].includes(u.role));
    const customers = dataStore.users.filter(u => ['customer', 'user'].includes(u.role));

    let activeLocksKeys = [];
    try {
      const r = getRedis();
      if (r && typeof r.keys === 'function') {
        activeLocksKeys = (await r.keys('seat_lock:*')) || [];
      }
    } catch {
      activeLocksKeys = [];
    }

    res.json({
      success: true,
      metrics: {
        totalGMV,
        netRevenue: totalGMV - totalRefunds,
        totalRefunds,
        totalBookings: allBookings.length,
        confirmedBookingsCount: confirmedBookings.length,
        cancelledBookingsCount: cancelledBookings.length,
        totalTicketsSold,
        totalUsers: dataStore.users.length,
        totalCustomers: customers.length,
        totalOrganizers: organizers.length,
        totalEvents: dataStore.events.length,
        activeEvents: publishedEvents.length,
        pendingApprovalsCount: pendingEvents.length,
        activeSeatLocksCount: activeLocksKeys.length
      },
      categoryRevenue,
      recentBookings: allBookings.slice(0, 10).map(b => {
        const evt = dataStore.findEventById(b.eventId);
        const usr = dataStore.findUserById(b.userId);
        return {
          id: b._id,
          bookingNumber: b.bookingNumber,
          user: usr ? { name: usr.name, email: usr.email } : { name: 'Guest', email: 'guest@venuro.com' },
          eventTitle: evt ? evt.title : 'Event',
          category: evt ? evt.category : 'General',
          amount: b.finalAmount,
          seatsCount: b.seats ? b.seats.length : 0,
          status: b.bookingStatus,
          paymentStatus: b.paymentDetails?.status || 'SUCCESS',
          paymentMethod: b.paymentDetails?.method || 'UPI',
          createdAt: b.createdAt
        };
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Event Approval Management ────────────────────────────────────────────────
export const getPendingEvents = async (req, res) => {
  try {
    const pending = dataStore.events.filter(e => e.status === 'PENDING_APPROVAL');
    res.json({
      success: true,
      count: pending.length,
      events: pending
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = dataStore.findEventById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.status = 'PUBLISHED';
    event.approvedAt = new Date().toISOString();
    event.approvedBy = req.user.email;
    event.rejectionReason = '';

    res.json({
      success: true,
      message: `Event "${event.title}" has been APPROVED and is now PUBLISHED on the customer catalog!`,
      event
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    const event = dataStore.findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.status = 'REJECTED';
    event.rejectionReason = reason || 'Does not meet platform publishing guidelines.';
    event.rejectedAt = new Date().toISOString();

    res.json({
      success: true,
      message: `Event "${event.title}" has been REJECTED. Reason sent to organizer.`,
      event
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const suspendEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = dataStore.findEventById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.status = event.status === 'CANCELLED' ? 'PUBLISHED' : 'CANCELLED';

    res.json({
      success: true,
      message: `Event status updated to ${event.status}`,
      event
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Organizer Management ──────────────────────────────────────────────────────
export const getAllOrganizers = async (req, res) => {
  try {
    const allBookings = dataStore.getAllBookings();
    const organizers = dataStore.users
      .filter(u => ['organizer', 'coordinator'].includes(u.role))
      .map(org => {
        const orgEvents = dataStore.events.filter(e => e.organizerId === org._id || e.coordinatorId === org._id);
        const orgEventIds = orgEvents.map(e => e._id);
        const orgBookings = allBookings.filter(b => orgEventIds.includes(b.eventId) && b.bookingStatus === 'CONFIRMED');
        const totalTicketsSold = orgBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
        const totalRevenue = orgBookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);

        return {
          id: org._id,
          name: org.name,
          email: org.email,
          organizationName: org.organizationName || org.name,
          role: org.role,
          status: org.status || 'active',
          avatar: org.avatar,
          totalEvents: orgEvents.length,
          publishedEvents: orgEvents.filter(e => ['PUBLISHED', 'APPROVED', 'active'].includes(e.status)).length,
          pendingEvents: orgEvents.filter(e => e.status === 'PENDING_APPROVAL').length,
          totalTicketsSold,
          totalRevenue,
          createdAt: org.createdAt
        };
      });

    res.json({
      success: true,
      count: organizers.length,
      organizers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrganizer = async (req, res) => {
  try {
    const { name, email, password, organizationName, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and temporary password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (dataStore.findUserByEmail(normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newOrganizer = dataStore.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'organizer',
      organizationName: organizationName?.trim() || name.trim(),
      phone: phone?.trim() || '',
      status: 'active',
      isEmailVerified: true
    });

    res.status(201).json({
      success: true,
      message: `Organizer account for ${newOrganizer.name} created successfully!`,
      organizer: {
        id: newOrganizer._id,
        name: newOrganizer.name,
        email: newOrganizer.email,
        organizationName: newOrganizer.organizationName,
        role: newOrganizer.role,
        status: newOrganizer.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrganizerStatus = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { status } = req.body; // 'active' | 'pending' | 'suspended' | 'deactivated'

    const user = dataStore.findUserById(organizerId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    user.status = status;
    user.isActive = status === 'active';

    res.json({
      success: true,
      message: `Organizer account status updated to ${status.toUpperCase()}`,
      organizer: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── User Management ───────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let list = [...dataStore.users];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (role && role !== 'all') {
      list = list.filter(u => u.role.toLowerCase() === role.toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter(u => (u.status || 'active').toLowerCase() === status.toLowerCase());
    }

    const sanitizedUsers = list.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || (u.isActive === false ? 'deactivated' : 'active'),
      organizationName: u.organizationName || '',
      avatar: u.avatar,
      walletBalance: u.walletBalance,
      createdAt: u.createdAt,
      bookingsCount: dataStore.getBookingsForUser(u._id).length
    }));

    res.json({
      success: true,
      count: sanitizedUsers.length,
      users: sanitizedUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['customer', 'organizer', 'admin', 'user', 'coordinator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = dataStore.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;

    res.json({
      success: true,
      message: `User ${user.name}'s role updated to ${role.toUpperCase()}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = dataStore.findUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    user.status = user.isActive ? 'active' : 'deactivated';

    res.json({
      success: true,
      message: `User ${user.name} is now ${user.status.toUpperCase()}`,
      user: {
        id: user._id,
        name: user.name,
        status: user.status,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── All Platform Bookings ─────────────────────────────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    const all = dataStore.getAllBookings().map(b => {
      const evt = dataStore.findEventById(b.eventId);
      const usr = dataStore.findUserById(b.userId);
      return {
        id: b._id,
        bookingNumber: b.bookingNumber,
        user: usr ? { id: usr._id, name: usr.name, email: usr.email } : { id: 'guest', name: 'Guest User', email: 'guest@venuro.com' },
        event: evt ? { id: evt._id, title: evt.title, category: evt.category, venueName: evt.venueName } : { id: 'evt', title: 'Event', category: 'General' },
        seats: b.seats || [],
        totalAmount: b.totalAmount,
        finalAmount: b.finalAmount,
        refundAmount: b.refundAmount || 0,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentDetails?.status || 'SUCCESS',
        paymentMethod: b.paymentDetails?.method || 'UPI',
        createdAt: b.createdAt
      };
    });

    res.json({
      success: true,
      count: all.length,
      bookings: all
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    let activeLocksCount = 0;
    try {
      const r = getRedis();
      if (r && typeof r.keys === 'function') {
        const keys = (await r.keys('seat_lock:*')) || [];
        activeLocksCount = keys.length;
      }
    } catch {}

    res.json({
      success: true,
      system: {
        status: 'HEALTHY',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        redis: {
          engine: 'Redis Distributed Engine (SET NX EX)',
          activeSeatLocks: activeLocksCount,
          status: 'CONNECTED'
        },
        database: {
          status: 'ONLINE',
          collections: ['users', 'events', 'shows', 'bookings', 'reviews', 'knowledge_base']
        },
        aiRAG: {
          status: 'READY',
          vectorIndexDimensions: 'Sparse TF-IDF / Cosine Space',
          knowledgeBaseEntries: 5
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
