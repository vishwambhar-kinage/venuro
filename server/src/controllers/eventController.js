import { dataStore } from '../models/dataStore.js';

export const getAllEvents = async (req, res) => {
  try {
    const { category, city, search, status } = req.query;
    
    // By default, only show approved/published/active events to public
    const events = dataStore.getAllEvents({ 
      category, 
      city, 
      search, 
      status: status || 'PUBLISHED',
      publicOnly: !status
    });

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = dataStore.findEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const shows = dataStore.getShowsForEvent(event._id);
    const reviews = dataStore.getReviewsForEvent(event._id);

    res.json({
      success: true,
      event,
      shows,
      reviews
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const organizerId = req.user._id || req.user.id;
    const { 
      title, 
      category, 
      city, 
      venueName, 
      address, 
      description,
      posterUrl,
      bannerUrl,
      duration,
      language,
      ageLimit,
      cast,
      date,
      startTime,
      endTime,
      ticketCategories,
      capacity,
      terms,
      contactEmail,
      contactPhone,
      submitForApproval
    } = req.body;

    if (!title?.trim() || !category || !city?.trim() || !venueName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required event details (title, category, city, venueName).'
      });
    }

    const initialStatus = submitForApproval ? 'PENDING_APPROVAL' : 'DRAFT';

    const eventData = {
      title: title.trim(),
      category: category.toLowerCase(),
      city: city.trim(),
      venueName: venueName.trim(),
      address: address?.trim() || `${venueName}, ${city}`,
      description: description?.trim() || '',
      posterUrl: posterUrl?.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      bannerUrl: bannerUrl?.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
      duration: duration || '2h 30m',
      language: language || 'English / Hindi',
      ageLimit: ageLimit || '13+',
      cast: Array.isArray(cast) ? cast : (typeof cast === 'string' ? cast.split(',').map(s => s.trim()) : []),
      date: date || new Date().toISOString().split('T')[0],
      startTime: startTime || '19:30',
      endTime: endTime || '22:00',
      ticketCategories: ticketCategories || [
        { name: 'VIP', price: 2499, capacity: 50, available: 50 },
        { name: 'Premium', price: 1499, capacity: 150, available: 150 },
        { name: 'Regular', price: 799, capacity: 300, available: 300 }
      ],
      capacity: capacity || 500,
      terms: terms || 'Tickets once booked cannot be exchanged. Please carry a valid ID.',
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone || '',
      organizerId: organizerId,
      coordinatorId: organizerId,
      organizerName: req.user.organizationName || req.user.name || 'Venuro Verified Organizer',
      status: initialStatus
    };

    const newEvent = dataStore.createEvent(eventData);

    // Auto-create default shows for the new event
    dataStore.createShow({
      eventId: newEvent._id,
      screenName: `${venueName} Main Arena / Audi 1`,
      date: eventData.date,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      pricingTiers: [
        { tier: 'VIP', price: eventData.ticketCategories[0]?.price || 2499, rows: ['A', 'B'] },
        { tier: 'PREMIUM', price: eventData.ticketCategories[1]?.price || 1499, rows: ['C', 'D', 'E'] },
        { tier: 'STANDARD', price: eventData.ticketCategories[2]?.price || 799, rows: ['F', 'G', 'H', 'I', 'J', 'K'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: initialStatus === 'PENDING_APPROVAL' 
        ? 'Event created and submitted for Admin approval!' 
        : 'Event draft created successfully. You can submit it for approval when ready.',
      event: newEvent
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = dataStore.findEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id || req.user.id;
    const isOwner = event.organizerId === userId || event.coordinatorId === userId;

    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only edit your own events.' });
    }

    const updated = dataStore.updateEvent(id, req.body);

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const event = dataStore.findEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id || req.user.id;
    const isOwner = event.organizerId === userId || event.coordinatorId === userId;

    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only submit your own events.' });
    }

    event.status = 'PENDING_APPROVAL';
    event.submittedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Event submitted for Admin approval successfully!',
      event
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = dataStore.findEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id || req.user.id;
    const isOwner = event.organizerId === userId || event.coordinatorId === userId;

    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only cancel your own events.' });
    }

    event.status = 'CANCELLED';
    event.cancelledAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Event has been marked as CANCELLED.',
      event
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = dataStore.findEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id || req.user.id;
    const isOwner = event.organizerId === userId || event.coordinatorId === userId;

    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    dataStore.deleteEvent(id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user._id || req.user.id;
    const events = dataStore.events.filter(e => e.organizerId === organizerId || e.coordinatorId === organizerId);
    
    // Attach live booking analytics to organizer events
    const allBookings = dataStore.getAllBookings();
    const enriched = events.map(evt => {
      const evtBookings = allBookings.filter(b => b.eventId === evt._id && b.bookingStatus === 'CONFIRMED');
      const ticketsSold = evtBookings.reduce((acc, b) => acc + (b.seats ? b.seats.length : 0), 0);
      const revenue = evtBookings.reduce((acc, b) => acc + (b.finalAmount || 0), 0);
      return {
        ...evt,
        ticketsSold,
        revenue,
        bookingsCount: evtBookings.length
      };
    });

    res.json({
      success: true,
      events: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCoordinatorEvents = getOrganizerEvents;
