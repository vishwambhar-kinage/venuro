import mongoose from 'mongoose';

/**
 * Booking Schema — Venuro Platform
 *
 * Lifecycle: pending → confirmed → cancelled / refunded
 * Payment: Razorpay order → payment → signature verification → confirmed
 */
const bookingSchema = new mongoose.Schema({
  // Relations
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required'],
  },
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: [true, 'Show is required'],
  },

  // Seats booked
  seats: [{
    seatId: String,
    row: String,
    number: Number,
    type: { type: String, enum: ['standard', 'premium', 'vip', 'recliner'] },
    price: Number,
  }],

  // Pricing
  totalAmount: { type: Number, required: true },       // seats sum
  convenienceFee: { type: Number, default: 0 },        // 5% platform fee
  grandTotal: { type: Number, required: true },        // totalAmount + fee

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending',
  },

  // Payment (Razorpay)
  payment: {
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    method: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    refundId: { type: String, default: '' },
  },

  // QR Ticket
  qrCode: { type: String, default: '' },   // base64 PNG
  qrData: { type: String, default: '' },   // signed payload

  // Cancellation
  cancelledAt: { type: Date },
  cancelReason: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ show: 1, status: 1 });
bookingSchema.index({ 'payment.razorpayOrderId': 1 });

export default mongoose.model('Booking', bookingSchema);
