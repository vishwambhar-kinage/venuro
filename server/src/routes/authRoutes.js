import express from 'express';
import { 
  register, 
  verifyOTP, 
  login, 
  organizerLogin,
  adminLogin,
  forgotPassword, 
  resetPassword, 
  getMe 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Customer Auth
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/organizer-login', organizerLogin);
router.post('/admin-login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected User Profile
router.get('/me', protect, getMe);

export default router;
