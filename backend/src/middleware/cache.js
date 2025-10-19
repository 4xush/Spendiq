import { getCache, setCache } from '../config/redisClient.js';

/**
 * Middleware for caching API responses
 * @param {string} keyPrefix - Prefix for the cache key (e.g., 'transactions', 'categories')
 * @param {number} expiration - TTL in seconds, defaults to 10 minutes
 * @param {Function} [keyGenerator] - Optional function to generate custom cache key
 * @returns {Function} Express middleware function
 */
function cacheMiddleware(keyPrefix, expiration, keyGenerator = null) {
    return async (req, res, next) => {
        try {
            // Generate cache key based on keyPrefix and either custom generator or request params
            const cacheKey = keyGenerator
                ? keyGenerator(req)
                : `${keyPrefix}:${req.user._id}:${req.originalUrl}`;

            // Try to get data from cache
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                // Return cached data if it exists
                return res.status(200).json(cachedData);
            }

            // Store original send method to intercept response
            const originalSend = res.send;

            // Override response send method to cache response before sending
            res.send = function (body) {
                try {
                    const parsedBody = JSON.parse(body);
                    // Only cache successful responses
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        setCache(cacheKey, parsedBody, expiration)
                            .catch(err => console.error('Failed to set cache:', err));
                    }
                } catch (error) {
                    console.error('Error parsing response body for caching:', error);
                }

                // Call original send method
                return originalSend.call(this, body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            // Continue with request even if caching fails
            next();
        }
    };
}

export default cacheMiddleware;