import express from 'express';
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getOrganizerEvents,
  submitForApproval,
  cancelEvent
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public Discovery (Only Published & Approved Events)
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Organizer Protected Routes
router.get('/organizer/my-events', protect, authorizeRoles('organizer', 'coordinator', 'admin'), getOrganizerEvents);
router.get('/coordinator/my-events', protect, authorizeRoles('organizer', 'coordinator', 'admin'), getOrganizerEvents);

router.post('/', protect, authorizeRoles('organizer', 'coordinator', 'admin'), createEvent);
router.put('/:id', protect, authorizeRoles('organizer', 'coordinator', 'admin'), updateEvent);
router.post('/:id/submit-approval', protect, authorizeRoles('organizer', 'coordinator', 'admin'), submitForApproval);
router.post('/:id/cancel', protect, authorizeRoles('organizer', 'coordinator', 'admin'), cancelEvent);
router.delete('/:id', protect, authorizeRoles('organizer', 'coordinator', 'admin'), deleteEvent);

export default router;
