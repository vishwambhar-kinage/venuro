import { getRedis } from '../config/redis.js';

/**
 * Redis Seat Lock Service — Venuro Platform
 *
 * Implements atomic concurrency-safe seat locking using Redis SET NX EX.
 *
 * ─── Interview Explanation ──────────────────────────────────────────────────
 * Problem: Two users try to book the same seat simultaneously.
 *
 * Solution: Redis atomic SET NX EX (Set if Not eXists with EXpiry):
 *   - SET seat:showId:seatId  userId  NX  EX 300
 *   - NX = only succeed if key does NOT exist (atomic, no race condition)
 *   - EX 300 = auto-expire in 5 minutes (cleanup if user abandons checkout)
 *   - Returns 1 (lock acquired) or 0 (already locked by someone else)
 *
 * Result: Even with 10,000 concurrent requests, only ONE user gets the lock.
 * Redis guarantees atomicity — no distributed locks needed for single-instance.
 *
 * Flow:
 *   User selects seat → lockSeat() → Redis SET NX EX 300
 *     ↓ success (NX returned 1)           ↓ fail (key exists)
 *   Show seat as "locked" (yellow)      Show seat as "locked" (red, someone else)
 *   User pays within 5 min              
 *   → verifyAndConfirmPayment()
 *   → Mark seat as 'booked' in DB
 *   → unlockAllUserSeats() removes Redis keys
 *   ──────────────────────────────────────────────────────────────────────────
 */

const LOCK_PREFIX = 'seat_lock:';
const LOCK_TTL = 300; // 5 minutes in seconds

/**
 * Lock a single seat for a user.
 * @returns {{ success: boolean, lockedBy?: string, ttl?: number }}
 */
export const lockSeat = async (showId, seatId, userId) => {
  const redis = getRedis();
  const key = `${LOCK_PREFIX}${showId}:${seatId}`;

  // Atomic SET NX EX — the heart of race condition prevention
  let locked;
  if (typeof redis.setNX === 'function') {
    // ioredis or in-memory client
    locked = await redis.setNX(key, userId);
    if (locked === 1) {
      await redis.expire(key, LOCK_TTL);
    }
    locked = locked === 1;
  } else {
    // node-redis style
    const result = await redis.set(key, userId, { NX: true, EX: LOCK_TTL });
    locked = result === 'OK';
  }

  if (locked) {
    return { success: true, ttl: LOCK_TTL, message: 'Seat locked for 5 minutes' };
  }

  // Check if the same user already holds this lock (re-lock = extend TTL)
  const currentHolder = await redis.get(key);
  if (currentHolder === userId) {
    await redis.expire(key, LOCK_TTL); // Extend TTL
    return { success: true, ttl: LOCK_TTL, extended: true, message: 'Lock extended' };
  }

  const ttl = await redis.ttl(key);
  return {
    success: false,
    reason: 'Seat is temporarily held by another user',
    retryAfter: ttl > 0 ? ttl : null,
  };
};

/**
 * Unlock a seat — only the lock owner can unlock it.
 */
export const unlockSeat = async (showId, seatId, userId) => {
  const redis = getRedis();
  const key = `${LOCK_PREFIX}${showId}:${seatId}`;
  const currentHolder = await redis.get(key);

  if (currentHolder !== userId) {
    return { success: false, reason: 'You do not hold this lock' };
  }

  await redis.del(key);
  return { success: true };
};

/**
 * Release ALL seat locks held by a user for a show.
 * Called after successful payment or on session timeout.
 */
export const unlockAllUserSeats = async (showId, userId) => {
  const redis = getRedis();
  const keys = await redis.keys(`${LOCK_PREFIX}${showId}:*`);
  let released = 0;

  for (const key of keys) {
    const holder = await redis.get(key);
    if (holder === userId) {
      await redis.del(key);
      released++;
    }
  }
  return { released };
};

/**
 * Get lock status for multiple seats in a show.
 * Used to update the seat matrix UI in real-time.
 */
export const getSeatLockStatuses = async (showId, seatIds) => {
  const redis = getRedis();
  const statuses = {};

  for (const seatId of seatIds) {
    const key = `${LOCK_PREFIX}${showId}:${seatId}`;
    const holder = await redis.get(key);
    const ttl = holder ? await redis.ttl(key) : -2;

    statuses[seatId] = holder
      ? { locked: true, ttl: ttl > 0 ? ttl : 0 }
      : { locked: false };
  }

  return statuses;
};

export const isSeatLocked = async (showId, seatId) => {
  const redis = getRedis();
  const key = `${LOCK_PREFIX}${showId}:${seatId}`;
  const holder = await redis.get(key);
  return { locked: !!holder, lockedBy: holder || null };
};

export class RedisLockService {
  static async acquireSeatLocks(showId, seatIds, userId, ttl = 300) {
    const lockedSeats = [];
    const failedSeats = [];

    for (const seatId of seatIds) {
      const res = await lockSeat(showId, seatId, userId);
      if (res.success) {
        lockedSeats.push(seatId);
      } else {
        failedSeats.push(seatId);
      }
    }

    if (failedSeats.length > 0) {
      for (const seatId of lockedSeats) {
        await unlockSeat(showId, seatId, userId);
      }
      return {
        success: false,
        message: `Seats (${failedSeats.join(', ')}) are currently held by another user.`,
        failedSeats
      };
    }

    return {
      success: true,
      lockedSeats,
      ttlSeconds: ttl
    };
  }

  static async releaseSeatLocks(showId, seatIds, userId) {
    const released = [];
    for (const seatId of seatIds) {
      const res = await unlockSeat(showId, seatId, userId);
      if (res.success) released.push(seatId);
    }
    return { released };
  }

  static async getActiveLocksForShow(showId) {
    const redis = getRedis();
    const keys = await redis.keys(`${LOCK_PREFIX}${showId}:*`);
    const active = {};
    for (const key of keys) {
      const seatId = key.split(':').pop();
      const holder = await redis.get(key);
      const ttl = await redis.ttl(key);
      if (holder && ttl > 0) {
        active[seatId] = { userId: holder, remainingSeconds: ttl };
      }
    }
    return active;
  }
}
