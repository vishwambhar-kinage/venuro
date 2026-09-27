import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { seedInitialData } from './utils/seedData.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

  // Join a show room to receive seat updates for that show
  socket.on('join_show', (showId) => {
    socket.join(`show_${showId}`);
  });

  socket.on('leave_show', (showId) => {
    socket.leave(`show_${showId}`);
  });

  // User is selecting/deselecting a seat — broadcast to others in same show
  socket.on('seat_locked', ({ showId, seatId, userId }) => {
    socket.to(`show_${showId}`).emit('seat_status_update', { seatId, status: 'locked' });
  });

  socket.on('seat_unlocked', ({ showId, seatId }) => {
    socket.to(`show_${showId}`).emit('seat_status_update', { seatId, status: 'available' });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ── Security & CORS ───────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Global Rate Limit ─────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '2.0.0',
    platform: 'Venuro Entertainment API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot Sequence ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // 1. Initialize Redis (in-memory or cloud)
    await initRedis();

    // 2. Connect to MongoDB Atlas (optional, graceful fallback)
    await connectDB();

    // 3. Seed demo data
    await seedInitialData();

    // 4. Start HTTP + WebSocket server
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('======================================================');
      console.log(`🎟️  VENURO API SERVER IS RUNNING ON PORT ${PORT}`);
      console.log(`🌐  API URL: http://localhost:${PORT}/api`);
      console.log(`🤖  AI RAG & Redis Locking Engine: ACTIVE`);
      console.log(`💳  Payment: ${process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('your') ? 'Razorpay (live)' : 'Simulation mode'}`);
      console.log(`📧  Email: ${process.env.EMAIL_APP_PASSWORD && !process.env.EMAIL_APP_PASSWORD.includes('xxxx') ? 'Gmail SMTP (live)' : 'Dev console mode'}`);
      console.log('======================================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start Venuro server:', error);
    process.exit(1);
  }
})();
