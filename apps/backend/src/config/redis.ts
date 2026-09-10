/**
 * Redis client singleton (ioredis).
 * Used for:
 *  - BullMQ job queues
 *  - Checkout availability locks (SETNX with TTL)
 *  - Layer-1 estimate reference table cache
 *  - Geocode result cache
 *
 * Keyspace notifications must be enabled on the Redis server:
 *   redis-cli CONFIG SET notify-keyspace-events KEA
 * (Or configure this in the managed Redis dashboard, e.g. Upstash)
 */

import Redis from 'ioredis';
import { getEnv } from './env';

let _redis: Redis;
let _redisSub: Redis; // separate connection for keyspace subscriptions

export function getRedis(): Redis {
  if (!_redis) {
    const { REDIS_URL } = getEnv();
    _redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // required for BullMQ
      enableReadyCheck: false,
      lazyConnect: false,
    });

    _redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    _redis.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }
  return _redis;
}

/**
 * Separate Redis connection for Pub/Sub and keyspace notifications.
 * Once subscribed, this connection cannot issue regular commands.
 */
export function getRedisSub(): Redis {
  if (!_redisSub) {
    const { REDIS_URL } = getEnv();
    _redisSub = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
    });

    _redisSub.on('error', (err) => {
      console.error('❌ Redis sub error:', err.message);
    });
  }
  return _redisSub;
}

// ── Lock helpers ──────────────────────────────────────────────────

const SLOT_LOCK_PREFIX = 'lock:vehicle';
const SLOT_LOCK_TTL_SECONDS = 600; // 10 minutes — per tech spec §5.4

/**
 * Attempt to acquire a vehicle-date availability lock (SETNX with TTL).
 * Returns true if the lock was acquired, false if already held.
 */
export async function acquireSlotLock(
  vehicleId: string,
  date: string,
  draftBookingId: string
): Promise<boolean> {
  const key = `${SLOT_LOCK_PREFIX}:${vehicleId}:${date}`;
  const result = await getRedis().set(key, draftBookingId, 'EX', SLOT_LOCK_TTL_SECONDS, 'NX');
  return result === 'OK';
}

/**
 * Release a slot lock on successful booking confirmation.
 */
export async function releaseSlotLock(vehicleId: string, date: string): Promise<void> {
  const key = `${SLOT_LOCK_PREFIX}:${vehicleId}:${date}`;
  await getRedis().del(key);
}

/**
 * Check if a slot is currently locked (by any checkout).
 */
export async function isSlotLocked(vehicleId: string, date: string): Promise<boolean> {
  const key = `${SLOT_LOCK_PREFIX}:${vehicleId}:${date}`;
  const val = await getRedis().exists(key);
  return val === 1;
}

// ── Cache helpers ─────────────────────────────────────────────────

const GEOCODE_CACHE_PREFIX = 'cache:geocode';
const LAYER1_CACHE_KEY = 'cache:layer1-reference';
const CACHE_TTL_GEOCODE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const CACHE_TTL_LAYER1_SECONDS = 60 * 60 * 24; // 24 hours (refreshed nightly)

export async function getCachedGeocode(addressKey: string): Promise<string | null> {
  return getRedis().get(`${GEOCODE_CACHE_PREFIX}:${addressKey}`);
}

export async function setCachedGeocode(addressKey: string, data: string): Promise<void> {
  await getRedis().set(`${GEOCODE_CACHE_PREFIX}:${addressKey}`, data, 'EX', CACHE_TTL_GEOCODE_SECONDS);
}

export async function getLayer1ReferenceTable(): Promise<string | null> {
  return getRedis().get(LAYER1_CACHE_KEY);
}

export async function setLayer1ReferenceTable(data: string): Promise<void> {
  await getRedis().set(LAYER1_CACHE_KEY, data, 'EX', CACHE_TTL_LAYER1_SECONDS);
}
