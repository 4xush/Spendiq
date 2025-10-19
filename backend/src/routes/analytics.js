import express from 'express'
import {
    getSummary,
    getExpensesByCategory,
    getTransactionsByDate,
    getTopCategories,
    getCategories,
    exportAnalytics,
    dateRangeValidation
} from '../controllers/analyticsController.js'
import auth from '../middleware/auth.js'
import cacheMiddleware from '../middleware/cache.js'

const router = express.Router()

// All analytics routes require authentication
router.use(auth)

// Helper function to generate consistent cache keys for analytics endpoints
const analyticsKeyGenerator = (endpoint) => {
    return (req) => {
        const userId = req.user._id;
        const queryString = new URLSearchParams(req.query).toString();
        return `analytics:${endpoint}:${userId}:${queryString || 'default'}`;
    };
};

// Apply cache middleware to all analytics endpoints
router.get('/summary',
    dateRangeValidation,
    cacheMiddleware('analytics:summary', 60 * 5, analyticsKeyGenerator('summary')), // Cache for 5 minutes
    getSummary
)

router.get('/by-category',
    dateRangeValidation,
    cacheMiddleware('analytics:by-category', 60 * 5, analyticsKeyGenerator('by-category')),
    getExpensesByCategory
)

router.get('/by-date',
    dateRangeValidation,
    cacheMiddleware('analytics:by-date', 60 * 5, analyticsKeyGenerator('by-date')),
    getTransactionsByDate
)

router.get('/top-categories',
    dateRangeValidation,
    cacheMiddleware('analytics:top-categories', 60 * 10, analyticsKeyGenerator('top-categories')), // Cache for 10 minutes
    getTopCategories
)

router.get('/categories',
    cacheMiddleware('analytics:categories', 60 * 60, analyticsKeyGenerator('categories')), // Cache for 1 hour
    getCategories
)

// Don't cache exports as they might be large and used less frequently
router.get('/export', dateRangeValidation, exportAnalytics)

export default router