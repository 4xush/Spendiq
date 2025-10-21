import api from './api';

// Cache storage for API responses
const apiCache = {
    data: new Map(),
    timeouts: new Map()
};

/**
 * Get data from the API with optional caching
 * @param {string} url - API endpoint to fetch
 * @param {Object} options - Configuration options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.cacheDuration - Cache duration in milliseconds (default: 10000ms/10s)
 * @param {boolean} options.forceRefresh - Force refresh ignoring cache (default: false)
 * @returns {Promise<any>} - API response data
 */
export const getCached = async (url, options = {}) => {
    const {
        useCache = true,
        cacheDuration = 10000, // 10 seconds default
        forceRefresh = false
    } = options;

    const cacheKey = url;

    // Return cached data if available and not forcing refresh
    if (useCache && !forceRefresh && apiCache.data.has(cacheKey)) {
                 return apiCache.data.get(cacheKey);
    }

    try {
        // Fetch fresh data from API
                 const response = await api.get(url);
        const responseData = response.data;

        // Cache the response if caching is enabled
        if (useCache) {
            // Clear any existing timeout for this key
            if (apiCache.timeouts.has(cacheKey)) {
                clearTimeout(apiCache.timeouts.get(cacheKey));
            }

            // Store in cache
            apiCache.data.set(cacheKey, responseData);

            // Set expiration timeout
            const timeoutId = setTimeout(() => {
                apiCache.data.delete(cacheKey);
                apiCache.timeouts.delete(cacheKey);
                             }, cacheDuration);

            apiCache.timeouts.set(cacheKey, timeoutId);
                     }

        return responseData;
    } catch (error) {
        console.error(`[CachedAPI] Error fetching ${url}:`, error);
        throw error;
    }
};

/**
 * Clear all cached data or data for a specific URL
 * @param {string} [url] - Optional URL to clear from cache
 */
export const clearCache = (url) => {
    if (url) {
        // Clear specific URL cache
        if (apiCache.timeouts.has(url)) {
            clearTimeout(apiCache.timeouts.get(url));
            apiCache.timeouts.delete(url);
        }
        apiCache.data.delete(url);
             } else {
        // Clear all cache
        apiCache.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        apiCache.data.clear();
        apiCache.timeouts.clear();
             }
};

// Export regular API for non-cached operations
export { api };

export default {
    get: getCached,
    post: api.post.bind(api),
    put: api.put.bind(api),
    delete: api.delete.bind(api),
    patch: api.patch.bind(api),
    clearCache
};