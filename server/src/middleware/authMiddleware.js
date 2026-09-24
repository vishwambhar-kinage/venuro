import jwt from 'jsonwebtoken';
import { dataStore } from '../models/dataStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'venuro_super_secret_jwt_key_change_in_production_2026';

const isMongoConnected = () => !!dataStore.useMongoose;

const getUserModel = async () => {
  if (!isMongoConnected()) return null;
  try { return (await import('../models/User.js')).default; } catch { return null; }
};

/**
 * protect — JWT auth middleware
 * Verifies Bearer token → attaches user to req.user
 * Tries MongoDB first (if connected), falls back to in-memory dataStore
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookie
    let token = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.venuro_token) {
      token = req.cookies.venuro_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Please log in to continue.' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message: msg });
    }

    // Find user — MongoDB or in-memory
    let user = null;

    if (isMongoConnected()) {
      const User = await getUserModel();
      if (User) {
        try { user = await User.findById(decoded.id).select('-__v'); } catch { /* fall through */ }
      }
    }

    // Always check in-memory (covers seeded demo accounts)
    if (!user) {
      user = dataStore.findUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * optionalAuth — attach user if valid token present, continue as guest if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.venuro_token;

    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMongoConnected()) {
      const User = await getUserModel();
      if (User) {
        try { req.user = await User.findById(decoded.id); } catch { /* fall through */ }
      }
    }
    if (!req.user) {
      req.user = dataStore.findUserById(decoded.id);
    }
  } catch { /* invalid token — treat as guest */ }
  next();
};
