import { invalidateCache, invalidateCachePattern } from '../config/redisClient.js';

/**
 * Middleware for invalidating cache after successful data modifications
 * @param {string|string[]} cachePatterns - Cache key pattern(s) to invalidate
 * @returns {Function} Express middleware function
 */
function invalidateCacheMiddleware(cachePatterns) {
    return async (req, res, next) => {
        // Store original send and json methods
        const originalSend = res.send;
        const originalJson = res.json;

        // Function to invalidate caches if the response was successful
        const invalidateCaches = async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const userId = req.user?._id;
                    const patterns = Array.isArray(cachePatterns) ? cachePatterns : [cachePatterns];

                    // Process each pattern
                    for (const pattern of patterns) {
                        // If the pattern includes userId placeholder, replace it
                        const resolvedPattern = userId && pattern.includes(':userId:')
                            ? pattern.replace(':userId:', userId)
                            : pattern;

                        await invalidateCachePattern(resolvedPattern);
                    }
                } catch (error) {
                    console.error('Cache invalidation error:', error);
                    // Don't block the response for cache invalidation errors
                }
            }
        };

        // Override response methods to invalidate cache before sending
        res.send = async function (body) {
            await invalidateCaches();
            return originalSend.call(this, body);
        };

        res.json = async function (body) {
            await invalidateCaches();
            return originalJson.call(this, body);
        };

        next();
    };
}

export default invalidateCacheMiddleware;