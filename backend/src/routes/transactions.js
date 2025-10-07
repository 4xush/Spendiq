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

const router = express.Router()

// All transaction routes require authentication
router.use(auth)

// Categories route (must come before parameterized routes)
router.get('/categories', getCategories)

// P2P Transaction routes (must come before parameterized routes)
router.post('/p2p', createP2PTransaction)
router.get('/p2p', getP2PTransactions)
router.get('/p2p/summary', getP2PSummary)
router.patch('/p2p/:id/status', updateP2PStatus)

// Bulk operations (must come before parameterized routes)
router.delete('/bulk', bulkDeleteValidation, bulkDeleteTransactions)

// Regular transaction routes
router.post('/', transactionValidation, createTransaction)
router.get('/', listValidation, listTransactions)
router.get('/:id', getTransaction)
router.put('/:id', transactionValidation, updateTransaction)
router.delete('/:id', deleteTransaction)

export default router
