import express from 'express'
import {
    createTransaction,
    listTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    transactionValidation,
    listValidation
} from '../controllers/transactionController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// All transaction routes require authentication
router.use(auth)

router.post('/', transactionValidation, createTransaction)
router.get('/', listValidation, listTransactions)
router.get('/:id', getTransaction)
router.put('/:id', transactionValidation, updateTransaction)
router.delete('/:id', deleteTransaction)

export default router