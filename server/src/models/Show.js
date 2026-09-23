import mongoose from 'mongoose';

/**
 * Seat sub-schema
 * Each show has a flat array of seats (like a cinema seat map)
 */
const seatSchema = new mongoose.Schema({
  row: { type: String, required: true },       // 'A', 'B', 'C' ...
  number: { type: Number, required: true },    // 1, 2, 3 ...
  type: {
    type: String,
    enum: ['standard', 'premium', 'vip', 'recliner'],
    default: 'standard',
  },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'locked', 'booked'],
    default: 'available',
  },
}, { _id: true });

/**
 * Show Schema — a specific screening/performance of an Event
 * One Event can have multiple Shows (different dates/times)
 */
const showSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required'],
  },
  showDate: {
    type: Date,
    required: [true, 'Show date is required'],
  },
  showTime: {
    type: String,
    required: [true, 'Show time is required'],
    // e.g. "10:00 AM", "7:30 PM"
  },
  venue: {
    name: { type: String, default: '' },
    screen: { type: String, default: 'Screen 1' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
  },

  // Seat map
  seats: [seatSchema],
  totalSeats: { type: Number, default: 0 },
  availableSeats: { type: Number, default: 0 },

  // Pricing tiers
  pricing: {
    standard: { type: Number, default: 250 },
    premium: { type: Number, default: 450 },
    vip: { type: Number, default: 750 },
    recliner: { type: Number, default: 600 },
  },

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

showSchema.index({ event: 1, showDate: 1 });
showSchema.index({ 'venue.city': 1, isActive: 1 });

export default mongoose.model('Show', showSchema);
