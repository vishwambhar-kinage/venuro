import express from 'express';
import {
  lockSeats,
  releaseSeats,
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  verifyTicketScan
} from '../controllers/bookingController.js';
import { protect as requireAuth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/lock-seats', requireAuth, lockSeats);
router.post('/release-seats', requireAuth, releaseSeats);
router.post('/checkout', requireAuth, createBooking);
router.get('/my-bookings', requireAuth, getUserBookings);
router.get('/my', requireAuth, getUserBookings);
router.get('/:id', requireAuth, getBookingById);
router.post('/:id/cancel', requireAuth, cancelBooking);
router.post('/verify-qr', requireAuth, authorizeRoles('coordinator', 'admin'), verifyTicketScan);

export default router;
