import express from 'express'
import {
    createTransaction,
    listTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    transactionValidation,
    bulkDeleteValidation,
    listValidation,
    createP2PTransaction,
    getP2PTransactions,
    updateP2PStatus,
    getP2PSummary,
    getCategories
} from '../controllers/transactionController.js'
import auth from '../middleware/auth.js'
import cacheMiddleware from '../middleware/cache.js'
import invalidateCacheMiddleware from '../middleware/cacheInvalidation.js'

const router = express.Router()

// All transaction routes require authentication
router.use(auth)

// Categories route (must come before parameterized routes)
router.get('/categories', cacheMiddleware('categories', 60 * 60), getCategories) // Cache for 1 hour

// P2P Transaction routes (must come before parameterized routes)
router.post('/p2p',
    invalidateCacheMiddleware(['transactions:*', 'p2p:*']),
    createP2PTransaction
)
router.get('/p2p',
    cacheMiddleware('p2p', 60 * 5), // Cache for 5 minutes
    getP2PTransactions
)
router.get('/p2p/summary',
    cacheMiddleware('p2p:summary', 60 * 5), // Cache for 5 minutes
    getP2PSummary
)
router.patch('/p2p/:id/status',
    invalidateCacheMiddleware(['p2p:*', 'transactions:*']),
    updateP2PStatus
)

// Bulk operations (must come before parameterized routes)
router.delete('/bulk',
    bulkDeleteValidation,
    invalidateCacheMiddleware(['transactions:*', 'analytics:*']),
    bulkDeleteTransactions
)

// Regular transaction routes
router.post('/',
    transactionValidation,
    invalidateCacheMiddleware(['transactions:*', 'analytics:*']),
    createTransaction
)
router.get('/',
    listValidation,
    cacheMiddleware('transactions', 60 * 5, // Cache for 5 minutes
        (req) => {
            // Generate custom cache key based on user and query parameters
            const { userId } = req.user ? { userId: req.user._id } : { userId: 'guest' };
            const queryString = new URLSearchParams(req.query).toString();
            return `transactions:${userId}:${queryString}`;
        }
    ),
    listTransactions
)
router.get('/:id',
    cacheMiddleware('transaction:detail', 60 * 5,
        (req) => `transaction:${req.params.id}:${req.user._id}`
    ),
    getTransaction
)
router.put('/:id',
    transactionValidation,
    invalidateCacheMiddleware([
        'transactions:*',
        'analytics:*',
        `transaction:detail:${req => req.params.id}:*`
    ]),
    updateTransaction
)
router.delete('/:id',
    invalidateCacheMiddleware(['transactions:*', 'analytics:*']),
    deleteTransaction
)

export default router
