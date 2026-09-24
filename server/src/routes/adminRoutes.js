import express from 'express';
import { 
  getPlatformAnalytics, 
  getPendingEvents,
  approveEvent,
  rejectEvent,
  suspendEvent,
  getAllOrganizers,
  createOrganizer,
  updateOrganizerStatus,
  getAllUsers, 
  updateUserRole, 
  toggleUserStatus,
  getAllBookings,
  getSystemHealth 
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Admin Protection Barrier
router.use(protect);
router.use(authorizeRoles('admin'));

// Analytics
router.get('/analytics', getPlatformAnalytics);
router.get('/health', getSystemHealth);

// Event Approval & Governance
router.get('/events/pending', getPendingEvents);
router.post('/events/:eventId/approve', approveEvent);
router.post('/events/:eventId/reject', rejectEvent);
router.post('/events/:eventId/suspend', suspendEvent);

// Organizer Management
router.get('/organizers', getAllOrganizers);
router.post('/organizers', createOrganizer);
router.put('/organizers/:organizerId/status', updateOrganizerStatus);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/status', toggleUserStatus);

// All Bookings & Transactions Audit
router.get('/bookings', getAllBookings);

export default router;
