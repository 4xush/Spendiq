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

const router = express.Router()

// All analytics routes require authentication
router.use(auth)

router.get('/summary', dateRangeValidation, getSummary)
router.get('/by-category', dateRangeValidation, getExpensesByCategory)
router.get('/by-date', dateRangeValidation, getTransactionsByDate)
router.get('/top-categories', dateRangeValidation, getTopCategories)
router.get('/categories', getCategories)
router.get('/export', dateRangeValidation, exportAnalytics)

export default router