import { randomUUID } from 'crypto';

/**
 * Universal Unified Data Store for Venuro
 * Holds collections for Users, Events, Shows, Bookings, Reviews, and KnowledgeBase items.
 * Lifecycle for Events: DRAFT -> PENDING_APPROVAL -> APPROVED / PUBLISHED -> REJECTED / CANCELLED
 */

class UniversalDataStore {
  constructor() {
    this.users = [];
    this.events = [];
    this.shows = [];
    this.bookings = [];
    this.reviews = [];
    this.knowledgeBase = [];
    this.initialized = false;
  }

  // Users collection methods
  findUserById(id) {
    return this.users.find(u => u._id === id || u.id === id);
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData) {
    const user = {
      _id: userData._id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || 'customer', // 'customer' | 'organizer' | 'admin' | 'user' | 'coordinator'
      status: userData.status || 'active', // 'active' | 'pending' | 'suspended' | 'deactivated'
      organizationName: userData.organizationName || '',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      walletBalance: userData.walletBalance !== undefined ? userData.walletBalance : 1000,
      preferences: userData.preferences || ['Concerts', 'Movies'],
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  updateUser(id, updates) {
    const idx = this.users.findIndex(u => u._id === id || u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date().toISOString() };
    return this.users[idx];
  }

  // Events collection methods
  getAllEvents(filter = {}) {
    let result = [...this.events];

    // Customer visible statuses: PUBLISHED, APPROVED, active
    if (filter.publicOnly) {
      result = result.filter(e => ['PUBLISHED', 'APPROVED', 'active'].includes(e.status));
    } else if (filter.status && filter.status !== 'all') {
      result = result.filter(e => e.status.toUpperCase() === filter.status.toUpperCase());
    } else if (!filter.allStatuses) {
      // Default behavior for general catalog browsing: show published/approved/active events
      result = result.filter(e => ['PUBLISHED', 'APPROVED', 'active'].includes(e.status));
    }

    if (filter.category && filter.category !== 'all') {
      result = result.filter(e => e.category.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.city && filter.city !== 'all') {
      result = result.filter(e => (e.city || '').toLowerCase() === filter.city.toLowerCase());
    }
    if (filter.organizerId) {
      result = result.filter(e => e.organizerId === filter.organizerId || e.coordinatorId === filter.organizerId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.genre && e.genre.some(g => g.toLowerCase().includes(q))) ||
        (e.venueName && e.venueName.toLowerCase().includes(q))
      );
    }
    return result;
  }

  findEventById(id) {
    return this.events.find(e => e._id === id || e.id === id);
  }

  createEvent(eventData) {
    const organizerId = eventData.organizerId || eventData.coordinatorId || 'usr_coord_1';
    const newEvent = {
      _id: eventData._id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: eventData.title,
      slug: eventData.slug || eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: eventData.category || 'movies',
      description: eventData.description || '',
      bannerUrl: eventData.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
      posterUrl: eventData.posterUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600',
      city: eventData.city || 'Mumbai',
      venueName: eventData.venueName || eventData.venue?.name || 'Venuro Grand Arena',
      address: eventData.address || eventData.venue?.address || 'BKC, Mumbai, Maharashtra 400051',
      date: eventData.date || new Date().toISOString().split('T')[0],
      startTime: eventData.startTime || '19:30',
      endTime: eventData.endTime || '22:00',
      duration: eventData.duration || '2h 30m',
      language: eventData.language || 'English / Hindi',
      genre: eventData.genre || [eventData.category || 'Entertainment'],
      ageLimit: eventData.ageLimit || '13+',
      cast: eventData.cast || [],
      rating: eventData.rating || 4.8,
      totalReviews: eventData.totalReviews || 0,
      ticketCategories: eventData.ticketCategories || [
        { name: 'VIP', price: 2499, capacity: 50, available: 50 },
        { name: 'Premium', price: 1499, capacity: 150, available: 150 },
        { name: 'Regular', price: 799, capacity: 300, available: 300 }
      ],
      capacity: eventData.capacity || 500,
      seatConfiguration: eventData.seatConfiguration || 'standard',
      terms: eventData.terms || 'Tickets once booked cannot be exchanged. Please carry a valid ID.',
      contactEmail: eventData.contactEmail || '',
      contactPhone: eventData.contactPhone || '',
      organizerId: organizerId,
      coordinatorId: organizerId,
      organizerName: eventData.organizerName || 'Venuro Verified Organizer',
      status: eventData.status || 'DRAFT', // 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED'
      rejectionReason: eventData.rejectionReason || '',
      vectorEmbedding: eventData.vectorEmbedding || [],
      createdAt: new Date().toISOString()
    };
    this.events.unshift(newEvent);
    return newEvent;
  }

  updateEvent(id, updates) {
    const idx = this.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) return null;
    this.events[idx] = { ...this.events[idx], ...updates, updatedAt: new Date().toISOString() };
    return this.events[idx];
  }

  deleteEvent(id) {
    const idx = this.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) return false;
    this.events.splice(idx, 1);
    return true;
  }

  // Shows collection methods
  getShowsForEvent(eventId) {
    return this.shows.filter(s => s.eventId === eventId);
  }

  findShowById(id) {
    return this.shows.find(s => s._id === id || s.id === id);
  }

  createShow(showData) {
    const newShow = {
      _id: showData._id || `shw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      eventId: showData.eventId,
      screenName: showData.screenName || 'Audi 1 - Dolby Atmos 4K',
      date: showData.date || new Date().toISOString().split('T')[0],
      startTime: showData.startTime || '19:30',
      endTime: showData.endTime || '22:00',
      pricingTiers: showData.pricingTiers || [
        { tier: 'VIP', price: 1500, rows: ['A', 'B'] },
        { tier: 'PREMIUM', price: 900, rows: ['C', 'D', 'E'] },
        { tier: 'STANDARD', price: 500, rows: ['F', 'G', 'H', 'I'] },
        { tier: 'ECONOMY', price: 250, rows: ['J', 'K'] }
      ],
      seatGrid: showData.seatGrid || this._generateDefaultSeatGrid(showData.pricingTiers),
      totalSeats: showData.totalSeats || 120,
      availableSeats: showData.availableSeats || 120,
      createdAt: new Date().toISOString()
    };
    this.shows.push(newShow);
    return newShow;
  }

  _generateDefaultSeatGrid(customTiers) {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const cols = 12;
    const grid = [];

    const getTierFor = (rowLetter) => {
      if (['A', 'B'].includes(rowLetter)) return { tier: 'VIP', price: 1500 };
      if (['C', 'D', 'E'].includes(rowLetter)) return { tier: 'PREMIUM', price: 900 };
      if (['F', 'G', 'H', 'I'].includes(rowLetter)) return { tier: 'STANDARD', price: 500 };
      return { tier: 'ECONOMY', price: 250 };
    };

    rows.forEach(rowLetter => {
      const rowSeats = [];
      const tierInfo = getTierFor(rowLetter);
      for (let c = 1; c <= cols; c++) {
        const isPrebooked = Math.random() < 0.12;
        rowSeats.push({
          id: `${rowLetter}${c}`,
          row: rowLetter,
          col: c,
          tier: tierInfo.tier,
          price: tierInfo.price,
          status: isPrebooked ? 'booked' : 'available'
        });
      }
      grid.push(rowSeats);
    });

    return grid;
  }

  // Bookings collection methods
  createBooking(bookingData) {
    const newBooking = {
      _id: bookingData._id || `bkg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      bookingNumber: bookingData.bookingNumber || `VNR-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: bookingData.userId,
      eventId: bookingData.eventId,
      showId: bookingData.showId,
      seats: bookingData.seats || [],
      totalAmount: bookingData.totalAmount,
      convenienceFee: bookingData.convenienceFee || 40,
      discountAmount: bookingData.discountAmount || 0,
      finalAmount: bookingData.finalAmount,
      paymentDetails: bookingData.paymentDetails || {
        paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        method: 'UPI',
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      },
      bookingStatus: 'CONFIRMED',
      qrCodeData: bookingData.qrCodeData,
      qrCodeImage: bookingData.qrCodeImage,
      refundAmount: 0,
      cancellationReason: '',
      createdAt: new Date().toISOString()
    };
    this.bookings.unshift(newBooking);
    return newBooking;
  }

  findBookingById(id) {
    return this.bookings.find(b => b._id === id || b.bookingNumber === id);
  }

  getBookingsForUser(userId) {
    return this.bookings.filter(b => b.userId === userId);
  }

  getAllBookings() {
    return this.bookings;
  }

  cancelBooking(id, reason = 'User requested cancellation', refundAmount = 0) {
    const booking = this.findBookingById(id);
    if (!booking) return null;
    booking.bookingStatus = 'CANCELLED';
    booking.cancellationReason = reason;
    booking.refundAmount = refundAmount;
    booking.cancelledAt = new Date().toISOString();
    return booking;
  }

  // Reviews collection
  createReview(reviewData) {
    const review = {
      _id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: reviewData.userId,
      userName: reviewData.userName || 'Anonymous',
      userAvatar: reviewData.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      eventId: reviewData.eventId,
      rating: reviewData.rating || 5,
      comment: reviewData.comment || '',
      createdAt: new Date().toISOString()
    };
    this.reviews.unshift(review);
    return review;
  }

  getReviewsForEvent(eventId) {
    return this.reviews.filter(r => r.eventId === eventId);
  }
}

export const dataStore = new UniversalDataStore();
