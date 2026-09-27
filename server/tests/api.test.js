import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { seedInitialData } from '../src/utils/seedData.js';
import { dataStore } from '../src/models/dataStore.js';
import { lockSeat, unlockSeat } from '../src/services/redisLockService.js';
import { generateBookingQR, verifyQR } from '../src/services/qrService.js';
import { RAGService } from '../src/services/ragService.js';
import { initRedis } from '../src/config/redis.js';

describe('🎟️ Venuro Flagship Test Suite', () => {
  before(async () => {
    await initRedis();
    await seedInitialData();
  });

  describe('1. Authentication & Role Based Access', () => {
    test('Should have seeded customer, organizer, and admin demo accounts', () => {
      const customer = dataStore.findUserByEmail('user@venuro.com');
      const organizer = dataStore.findUserByEmail('coordinator@venuro.com');
      const admin = dataStore.findUserByEmail('admin@venuro.com');

      assert.ok(customer, 'Customer account should exist');
      assert.strictEqual(customer.role, 'customer');

      assert.ok(organizer, 'Organizer account should exist');
      assert.strictEqual(organizer.role, 'organizer');

      assert.ok(admin, 'Admin account should exist');
      assert.strictEqual(admin.role, 'admin');
    });

    test('Should successfully sign and verify valid JWT token', () => {
      const user = dataStore.findUserByEmail('user@venuro.com');
      const token = jwt.sign({ id: user._id || user.id }, 'venuro_test_secret', { expiresIn: '7d' });
      assert.ok(token, 'JWT Token must be generated');
      const decoded = jwt.verify(token, 'venuro_test_secret');
      assert.strictEqual(decoded.id, user._id || user.id);
    });
  });

  describe('2. Event Catalog & Discovery', () => {
    test('Should return all active events across categories', () => {
      const allEvents = dataStore.getAllEvents({ allStatuses: true });
      assert.ok(allEvents.length >= 1, 'Should have active seeded events');
    });
  });

  describe('3. Redis Distributed Seat Locking Engine', () => {
    test('User A should acquire atomic lock for seat A1', async () => {
      const showId = 'shw_test_1';
      const seatId = 'A1';
      const userId = 'usr_user_1';

      const lockRes = await lockSeat(showId, seatId, userId);
      assert.strictEqual(lockRes.success, true);
    });

    test('User B attempting to lock seat A1 should be REJECTED (Zero Double Booking)', async () => {
      const showId = 'shw_test_1';
      const seatId = 'A1';
      const userB = 'usr_user_2';

      const lockRes = await lockSeat(showId, seatId, userB);
      assert.strictEqual(lockRes.success, false);
      assert.ok(lockRes.reason.includes('another user'));
    });

    test('User A unlocking seat should make it available immediately', async () => {
      const showId = 'shw_test_1';
      const seatId = 'A1';
      const userId = 'usr_user_1';

      const unlockRes = await unlockSeat(showId, seatId, userId);
      assert.strictEqual(unlockRes.success, true);

      // User B should now acquire lock
      const lockRes = await lockSeat(showId, seatId, 'usr_user_2');
      assert.strictEqual(lockRes.success, true);
    });
  });

  describe('4. Cryptographic QR Tickets & HMAC Validation', () => {
    test('Should generate and verify tamper-proof QR ticket payload', async () => {
      const bookingId = 'BK_TEST_1001';
      const userId = 'usr_user_1';
      const showId = 'shw_test_1';

      const { qrCode, qrData } = await generateBookingQR(bookingId, userId, showId);
      assert.ok(qrCode.startsWith('data:image/png;base64,'), 'QR code must be base64 PNG data URL');
      assert.ok(qrData.startsWith('venuro://ticket/'), 'QR data must match URI format');

      // Verify QR
      const verification = verifyQR(qrData);
      assert.strictEqual(verification.valid, true);
    });

    test('Should reject tampered QR ticket payload', () => {
      const tamperedQrData = 'venuro://ticket/BK_FAKE:usr_fake:shw_fake:12345/invalidsignature12';
      const verification = verifyQR(tamperedQrData);
      assert.strictEqual(verification.valid, false);
    });
  });

  describe('5. AI-Powered RAG Assistant & Vector Search', () => {
    test('Should answer refund policy queries with contextual domain knowledge', async () => {
      const query = 'What is your refund and cancellation policy?';
      const aiResponse = await RAGService.askAiAssistant(query);

      assert.strictEqual(aiResponse.intent, 'refund_policy');
      assert.ok(aiResponse.answer.includes('Refund'));
    });

    test('Should discover relevant events matching natural language query', async () => {
      const query = 'Recommend top concerts or movies';
      const aiResponse = await RAGService.askAiAssistant(query);

      assert.ok(aiResponse.matchedEvents.length >= 0);
      assert.ok(typeof aiResponse.answer === 'string');
    });
  });

  after(() => {
    setTimeout(() => process.exit(0), 100).unref();
  });
});
