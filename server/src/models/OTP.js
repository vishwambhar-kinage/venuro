import mongoose from 'mongoose';

/**
 * OTP Schema — for email verification and password reset
 * TTL index auto-deletes expired documents from MongoDB
 */
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['register', 'forgot', 'login'],
    default: 'register',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Auto-delete expired OTP documents (MongoDB TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, type: 1 });

export default mongoose.model('OTP', otpSchema);
