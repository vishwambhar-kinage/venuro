import express from 'express';
import { getShowsForEvent, getShowSeatMap, createShow } from '../controllers/showController.js';
import { protect as requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/event/:eventId', getShowsForEvent);
router.get('/:showId/seat-map', optionalAuth, getShowSeatMap);
router.post('/', requireAuth, authorizeRoles('coordinator', 'admin'), createShow);

export default router;
