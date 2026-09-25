import express from 'express';
import { createPaymentOrder, verifyAndConfirmPayment, simulatePayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// Create Razorpay order (or simulated order)
router.post('/create-order', createPaymentOrder);

// Verify payment signature and confirm booking
router.post('/verify', verifyAndConfirmPayment);

// Demo / simulation mode (no real Razorpay needed)
router.post('/simulate', simulatePayment);

export default router;
