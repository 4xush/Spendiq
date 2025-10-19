import express from 'express'
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    categoryValidation
} from '../controllers/categoryController.js'
import auth from '../middleware/auth.js'
import cacheMiddleware from '../middleware/cache.js'
import invalidateCacheMiddleware from '../middleware/cacheInvalidation.js'

const router = express.Router()

// All category routes require authentication
router.use(auth)

// Apply cache middleware to GET requests
router.get('/',
    cacheMiddleware('categories', 60 * 60, // Cache for 1 hour
        (req) => {
            const userId = req.user._id;
            const type = req.query.type || 'all';
            return `categories:${userId}:${type}`;
        }
    ),
    getCategories
)

// Apply cache invalidation to mutating operations
router.post('/',
    categoryValidation,
    invalidateCacheMiddleware(['categories:*', 'transactions:*', 'analytics:*']),
    createCategory
)

router.put('/:id',
    categoryValidation,
    invalidateCacheMiddleware(['categories:*', 'transactions:*', 'analytics:*']),
    updateCategory
)

router.delete('/:id',
    invalidateCacheMiddleware(['categories:*', 'transactions:*', 'analytics:*']),
    deleteCategory
)

export default router