import express from 'express';
import { chat, semanticSearch, getRecommendations, getAIStatus } from '../controllers/aiController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// AI rate limit: 45 requests per minute per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  standardHeaders: true,
  message: { success: false, message: 'AI rate limit reached. Please wait 1 minute.' },
});

router.post('/chat', aiLimiter, optionalAuth, chat);
router.get('/semantic-search', optionalAuth, semanticSearch);
router.post('/semantic-search', optionalAuth, semanticSearch);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/status', getAIStatus);

export default router;
