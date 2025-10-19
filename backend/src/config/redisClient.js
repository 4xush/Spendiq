import Redis from 'ioredis';

// Get Redis URL from environment variables with fallback
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client with connection options
const client = new Redis(redisUrl, {
    retryStrategy(times) {
        // Retry connection with exponential backoff
        console.log(`⚠️ Redis connection attempt ${times}`);
        // Reconnect after increasing time intervals (max 30s)
        return Math.min(times * 1000, 30000);
    },
    maxRetriesPerRequest: 3
});

// Handle Redis connection events
client.on('connect', () => {
    console.log('✅ Redis connected');
});

client.on('error', (err) => {
    console.error('⚠️ Redis error:', err);
});

client.on('reconnecting', () => {
    console.log('⚠️ Redis reconnecting...');
});

// Default TTL for cache entries (10 minutes)
const DEFAULT_EXPIRATION = 60 * 10;

/**
 * Get cached data for a key
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Parsed cached data or null
 */
async function getCache(key) {
    try {
        const cachedData = await client.get(key);
        if (cachedData) {
            console.log(`🔍 Cache hit for: ${key}`);
            return JSON.parse(cachedData);
        }
        console.log(`🔍 Cache miss for: ${key}`);
        return null;
    } catch (error) {
        console.error(`❌ Redis getCache error for key ${key}:`, error);
        return null;
    }
}

/**
 * Set data in cache with expiration
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @param {number} [expiration=DEFAULT_EXPIRATION] - TTL in seconds
 * @returns {Promise<boolean>} - Success status
 */
async function setCache(key, data, expiration = DEFAULT_EXPIRATION) {
    try {
        await client.set(key, JSON.stringify(data), 'EX', expiration);
        console.log(`💾 Cache set for: ${key} (TTL: ${expiration}s)`);
        return true;
    } catch (error) {
        console.error(`❌ Redis setCache error for key ${key}:`, error);
        return false;
    }
}

/**
 * Delete a specific cache key
 * @param {string} key - Cache key to invalidate
 * @returns {Promise<boolean>} - Success status
 */
async function invalidateCache(key) {
    try {
        await client.del(key);
        console.log(`🗑️ Cache invalidated for: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Redis invalidateCache error for key ${key}:`, error);
        return false;
    }
}

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Pattern to match keys (e.g. "user:*")
 * @returns {Promise<boolean>} - Success status
 */
async function invalidateCachePattern(pattern) {
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
        }
        return true;
    } catch (error) {
        console.error(`❌ Redis invalidateCachePattern error for pattern ${pattern}:`, error);
        return false;
    }
}

// Export Redis client and helper functions
export {
    client,
    getCache,
    setCache,
    invalidateCache,
    invalidateCachePattern,
    DEFAULT_EXPIRATION
};