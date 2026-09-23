import mongoose from 'mongoose';

/**
 * Event Schema — Venuro Platform
 * Supports: Movies, Concerts, Sports, Comedy, Theatre, Experiences
 * Lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED / PUBLISHED -> REJECTED / CANCELLED
 */
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [3000, 'Description cannot exceed 3000 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: ['movies', 'concerts', 'sports', 'live-shows', 'experiences', 'movie', 'concert', 'comedy', 'theatre', 'experience'],
    lowercase: true,
  },
  genre: [{ type: String, trim: true }],
  language: { type: String, default: 'English', trim: true },
  duration: { type: String, default: '2h 30m' }, // e.g. "2h 30m" or minutes
  rating: { type: Number, default: 4.8 },
  ageLimit: { type: String, default: '13+' },
  ageRating: { type: String, default: 'U/A' },

  // Media
  posterUrl: { type: String, default: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600' },
  bannerUrl: { type: String, default: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200' },
  trailerUrl: { type: String, default: '' },
  gallery: [{ type: String }],

  // Cast & Crew
  cast: [{ type: String }],
  crew: [{ name: String, role: String }],

  // Venue
  venueName: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: 'Mumbai' },
  state: { type: String, default: '' },
  coordinates: { lat: Number, lng: Number },
  venue: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    coordinates: { lat: Number, lng: Number },
  },

  // Scheduling & Dates
  date: { type: String, default: '' },
  startTime: { type: String, default: '19:30' },
  endTime: { type: String, default: '22:00' },

  // Ticket Categories & Capacity
  ticketCategories: [{
    name: { type: String, required: true }, // e.g. "VIP", "Premium", "Regular"
    price: { type: Number, required: true },
    capacity: { type: Number, default: 100 },
    available: { type: Number, default: 100 },
    description: { type: String, default: '' }
  }],
  capacity: { type: Number, default: 500 },
  seatConfiguration: { type: String, default: 'standard' },
  terms: { type: String, default: 'Tickets once booked cannot be exchanged. Please carry a valid ID.' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },

  // Ownership & Approval Lifecycle
  organizerId: { type: String, required: true },
  coordinatorId: { type: String }, // legacy alias
  organizerName: { type: String, default: '' },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'active', 'suspended'],
    default: 'DRAFT',
  },
  rejectionReason: { type: String, default: '' },
  approvedAt: { type: Date },
  approvedBy: { type: String },

  // Metadata
  tags: [{ type: String, trim: true, lowercase: true }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Stats
  totalReviews: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  ticketsSold: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },

  // AI — vector embedding
  vectorEmbedding: { type: [Number], select: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Indexes
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ organizerId: 1 });

export default mongoose.model('Event', eventSchema);
