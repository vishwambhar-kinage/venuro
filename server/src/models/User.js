import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema — Venuro Platform
 * Supports role-based access: customer | organizer | admin (with legacy aliases user | coordinator)
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'organizer', 'admin', 'user', 'coordinator'],
    default: 'customer',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'deactivated'],
    default: 'active',
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  preferences: {
    type: [String],
    default: ['Movies', 'Concerts'],
  },
  walletBalance: {
    type: Number,
    default: 1000,
  },
  bookingsCount: {
    type: Number,
    default: 0,
  },
  organizationName: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ── Pre-save hook: hash password ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare passwords ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── toJSON: remove sensitive fields ──────────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
