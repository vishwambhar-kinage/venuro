/**
 * Redis Configuration — Venuro
 *
 * Priority:
 *   1. Upstash Redis (cloud, serverless, free tier) — if UPSTASH_REDIS_URL set
 *   2. Local Redis via ioredis — if REDIS_URL set
 *   3. Full in-memory Redis clone — always works, zero config needed
 *
 * The in-memory implementation supports: SET NX EX, GET, DEL, KEYS, EXPIRE, TTL
 * It is suitable for single-instance development and demo deployments.
 */

// ── In-Memory Redis Clone ─────────────────────────────────────────────────────
class InMemoryRedis {
  constructor() {
    this.store = new Map();    // key → value
    this.expiries = new Map(); // key → expiry timestamp (ms)
    this.timers = new Map();   // key → timeout handle
  }

  _isExpired(key) {
    const exp = this.expiries.get(key);
    return exp !== undefined && Date.now() > exp;
  }

  _cleanup(key) {
    if (this._isExpired(key)) {
      this.store.delete(key);
      this.expiries.delete(key);
      this.timers.delete(key);
      return true;
    }
    return false;
  }

  _scheduleExpiry(key, ttlSeconds) {
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    const ms = ttlSeconds * 1000;
    this.expiries.set(key, Date.now() + ms);
    this.timers.set(key, setTimeout(() => {
      this.store.delete(key);
      this.expiries.delete(key);
      this.timers.delete(key);
    }, ms));
  }

  async set(key, value, options = {}) {
    // NX = only set if Not eXists
    if (options.NX && this.store.has(key) && !this._isExpired(key)) {
      return null;
    }
    this.store.set(key, String(value));
    if (options.EX) this._scheduleExpiry(key, options.EX);
    return 'OK';
  }

  // ioredis-style: setNX(key, value) returns 1 (set) or 0 (not set)
  async setNX(key, value) {
    if (this.store.has(key) && !this._cleanup(key)) return 0;
    this.store.set(key, String(value));
    return 1;
  }

  async get(key) {
    if (this._cleanup(key)) return null;
    return this.store.get(key) ?? null;
  }

  async del(key) {
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    this.store.delete(key);
    this.expiries.delete(key);
    this.timers.delete(key);
    return 1;
  }

  async expire(key, seconds) {
    if (!this.store.has(key) || this._isExpired(key)) return 0;
    this._scheduleExpiry(key, seconds);
    return 1;
  }

  async ttl(key) {
    if (!this.store.has(key)) return -2;
    const exp = this.expiries.get(key);
    if (exp === undefined) return -1;
    const remaining = Math.ceil((exp - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async keys(pattern) {
    const regexStr = '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
    const rx = new RegExp(regexStr);
    const result = [];
    for (const key of this.store.keys()) {
      if (!this._isExpired(key) && rx.test(key)) result.push(key);
    }
    return result;
  }

  async ping() { return 'PONG'; }
  async flushall() { this.store.clear(); this.expiries.clear(); this.timers.forEach(clearTimeout); this.timers.clear(); return 'OK'; }
}

// ── Module-level client ────────────────────────────────────────────────────────
let redisClient = null;
let redisType = 'none';

export const initRedis = async () => {
  // Option 1: Upstash Redis (HTTP-based, serverless-friendly)
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN &&
      !process.env.UPSTASH_REDIS_URL.includes('your-redis')) {
    try {
      // Use ioredis with Upstash TLS URL
      const { default: Redis } = await import('ioredis');
      const url = new URL(process.env.UPSTASH_REDIS_URL);
      redisClient = new Redis({
        host: url.hostname,
        port: Number(url.port) || 6380,
        password: process.env.UPSTASH_REDIS_TOKEN,
        tls: {},
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      await redisClient.connect();
      await redisClient.ping();
      redisType = 'upstash';
      console.log('✅ [Redis] Connected to Upstash Redis (cloud)');
      return;
    } catch (e) {
      console.log(`⚠️  [Redis] Upstash connection failed: ${e.message}`);
      redisClient = null;
    }
  }

  // Option 2: Local Redis
  if (process.env.REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis');
      redisClient = new Redis(process.env.REDIS_URL, { connectTimeout: 3000, maxRetriesPerRequest: 1, lazyConnect: true });
      await redisClient.connect();
      await redisClient.ping();
      redisType = 'local';
      console.log('✅ [Redis] Connected to local Redis');
      return;
    } catch (e) {
      console.log(`⚠️  [Redis] Local Redis failed: ${e.message}`);
      redisClient = null;
    }
  }

  // Option 3: In-Memory fallback (always works)
  redisClient = new InMemoryRedis();
  redisType = 'memory';
  console.log('⚡ [Redis] Using In-Memory Redis Engine (TTL + NX supported)');
};

export const getRedis = () => redisClient;
export const getRedisType = () => redisType;
export default { initRedis, getRedis, getRedisType };
