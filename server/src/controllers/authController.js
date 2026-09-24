import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dataStore } from '../models/dataStore.js';
import { generateOTP, sendOTPEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'venuro_super_secret_jwt_key_change_in_production_2026';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const isMongoConnected = () => !!dataStore.useMongoose;

const getModels = async () => {
  if (!isMongoConnected()) return { User: null, OTP: null };
  try {
    const User = (await import('../models/User.js')).default;
    const OTP = (await import('../models/OTP.js')).default;
    return { User, OTP };
  } catch {
    return { User: null, OTP: null };
  }
};

const memOTPs = new Map();
const pendingUsers = new Map();

const otpKey = (email, type) => `${email.toLowerCase()}:${type}`;

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id || user.id);
  const userData = user.toJSON ? user.toJSON() : { ...user };
  delete userData.password;
  delete userData.__v;
  return res.status(statusCode).json({ success: true, token, user: userData });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register (Public Customer Registration)
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    if (isMongoConnected()) {
      const { User } = await getModels();
      if (User) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing?.isEmailVerified)
          return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login.' });
      }
    } else {
      if (dataStore.findUserByEmail(normalizedEmail))
        return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login.' });
    }

    // Generate & store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (isMongoConnected()) {
      const { OTP } = await getModels();
      if (OTP) {
        await OTP.deleteMany({ email: normalizedEmail, type: 'register' });
        await OTP.create({ email: normalizedEmail, otp, type: 'register', expiresAt });
      }
    }
    memOTPs.set(otpKey(normalizedEmail, 'register'), { otp, expiresAt });
    
    // Explicitly enforce role='customer' for all public registrations
    pendingUsers.set(normalizedEmail, { 
      name: name.trim(), 
      email: normalizedEmail, 
      password,
      role: 'customer'
    });

    const result = await sendOTPEmail(normalizedEmail, otp, 'register');

    return res.status(200).json({
      success: true,
      message: result.devMode
        ? 'OTP generated — check the server terminal window for your 6-digit code'
        : `Verification OTP sent to ${normalizedEmail}. Check your inbox.`,
      devMode: result.devMode,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, type = 'register' } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    if (!/^\d{6}$/.test(otp))
      return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });

    const normalizedEmail = email.toLowerCase().trim();
    let otpValid = false;

    if (isMongoConnected()) {
      const { OTP } = await getModels();
      if (OTP) {
        const record = await OTP.findOne({
          email: normalizedEmail, otp, type,
          isUsed: false, expiresAt: { $gt: new Date() },
        });
        if (record) { record.isUsed = true; await record.save(); otpValid = true; }
      }
    }

    if (!otpValid) {
      const record = memOTPs.get(otpKey(normalizedEmail, type));
      if (record && record.otp === otp && new Date() <= record.expiresAt) {
        memOTPs.delete(otpKey(normalizedEmail, type));
        otpValid = true;
      }
    }

    if (!otpValid)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });

    if (type === 'register') {
      const pending = pendingUsers.get(normalizedEmail);
      if (!pending)
        return res.status(400).json({ success: false, message: 'Session expired. Please register again.' });

      let newUser;
      if (isMongoConnected()) {
        const { User } = await getModels();
        if (User) {
          const existing = await User.findOne({ email: normalizedEmail });
          if (existing) {
            existing.isEmailVerified = true;
            await existing.save();
            newUser = existing;
          } else {
            newUser = await User.create({ ...pending, role: 'customer', isEmailVerified: true });
          }
        }
      }

      if (!newUser) {
        const hashedPw = await bcrypt.hash(pending.password, 12);
        newUser = dataStore.createUser({ ...pending, role: 'customer', password: hashedPw, isEmailVerified: true });
      }

      pendingUsers.delete(normalizedEmail);
      return sendAuthResponse(newUser, 201, res);
    }

    return res.json({ success: true, message: 'OTP verified. You can now reset your password.', email: normalizedEmail });
  } catch (err) {
    console.error('[Auth] VerifyOTP error:', err.message);
    return res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login (Universal & Customer Login)
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      const { User } = await getModels();
      if (User) {
        const found = await User.findOne({ email: normalizedEmail }).select('+password');
        if (found && await found.comparePassword(password)) {
          user = found;
        }
      }
    }

    if (!user) {
      const found = dataStore.findUserByEmail(normalizedEmail);
      if (found) {
        let isValid = false;
        if (found.password?.startsWith('$2')) {
          isValid = await bcrypt.compare(password, found.password);
        } else {
          isValid = found.password === password;
        }
        if (isValid) user = found;
      }
    }

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (user.isActive === false || user.status === 'suspended' || user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact support.' });
    }

    return sendAuthResponse(user, 200, res);
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/organizer-login (Dedicated Organizer Portal Login)
// ─────────────────────────────────────────────────────────────────────────────
export const organizerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      const { User } = await getModels();
      if (User) {
        const found = await User.findOne({ email: normalizedEmail }).select('+password');
        if (found && await found.comparePassword(password)) user = found;
      }
    }

    if (!user) {
      const found = dataStore.findUserByEmail(normalizedEmail);
      if (found) {
        let isValid = false;
        if (found.password?.startsWith('$2')) isValid = await bcrypt.compare(password, found.password);
        else isValid = found.password === password;
        if (isValid) user = found;
      }
    }

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials for Organizer Portal.' });

    const role = (user.role || '').toLowerCase();
    if (role !== 'organizer' && role !== 'coordinator' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have an active Organizer account.'
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your organizer account is pending approval by the Platform Admin.'
      });
    }

    return sendAuthResponse(user, 200, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin-login (Dedicated Admin Portal Login)
// ─────────────────────────────────────────────────────────────────────────────
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoConnected()) {
      const { User } = await getModels();
      if (User) {
        const found = await User.findOne({ email: normalizedEmail }).select('+password');
        if (found && await found.comparePassword(password)) user = found;
      }
    }

    if (!user) {
      const found = dataStore.findUserByEmail(normalizedEmail);
      if (found) {
        let isValid = false;
        if (found.password?.startsWith('$2')) isValid = await bcrypt.compare(password, found.password);
        else isValid = found.password === password;
        if (isValid) user = found;
      }
    }

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials for Admin Portal.' });

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
      });
    }

    return sendAuthResponse(user, 200, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password & reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (isMongoConnected()) {
      const { OTP } = await getModels();
      if (OTP) {
        await OTP.deleteMany({ email: normalizedEmail, type: 'forgot' });
        await OTP.create({ email: normalizedEmail, otp, type: 'forgot', expiresAt });
      }
    }
    memOTPs.set(otpKey(normalizedEmail, 'forgot'), { otp, expiresAt });

    const result = await sendOTPEmail(normalizedEmail, otp, 'forgot');
    return res.json({
      success: true,
      message: result.devMode
        ? 'OTP generated — check server terminal for your 6-digit code'
        : `Reset OTP sent to ${normalizedEmail}`,
      devMode: result.devMode,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const normalizedEmail = email.toLowerCase().trim();
    let otpValid = false;

    if (isMongoConnected()) {
      const { OTP } = await getModels();
      if (OTP) {
        const r = await OTP.findOne({ email: normalizedEmail, otp, type: 'forgot', isUsed: false, expiresAt: { $gt: new Date() } });
        if (r) { r.isUsed = true; await r.save(); otpValid = true; }
      }
    }
    if (!otpValid) {
      const r = memOTPs.get(otpKey(normalizedEmail, 'forgot'));
      if (r && r.otp === otp && new Date() <= r.expiresAt) {
        memOTPs.delete(otpKey(normalizedEmail, 'forgot'));
        otpValid = true;
      }
    }
    if (!otpValid)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    if (isMongoConnected()) {
      const { User } = await getModels();
      if (User) {
        const u = await User.findOne({ email: normalizedEmail }).select('+password');
        if (u) { u.password = newPassword; await u.save(); return sendAuthResponse(u, 200, res); }
      }
    }

    const memUser = dataStore.findUserByEmail(normalizedEmail);
    if (memUser) {
      memUser.password = await bcrypt.hash(newPassword, 12);
      return sendAuthResponse(memUser, 200, res);
    }

    return res.status(404).json({ success: false, message: 'User not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = (req, res) => {
  const userData = req.user.toJSON ? req.user.toJSON() : { ...req.user };
  delete userData.password;
  return res.json({ success: true, user: userData });
};
