import Transaction from '../models/Transaction.js'
import { query, validationResult } from 'express-validator'

// Date range validation
export const dateRangeValidation = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
]

// Get financial summary
export const getSummary = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const { startDate, endDate } = req.query

        // Build date filter
        const dateFilter = {}
        if (startDate || endDate) {
            dateFilter.date = {}
            if (startDate) dateFilter.date.$gte = new Date(startDate)
            if (endDate) dateFilter.date.$lte = new Date(endDate)
        }

        // Get summary data using aggregation
        const summary = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ])

        // Format the result
        let totalIncome = 0
        let totalExpenses = 0
        let incomeCount = 0
        let expenseCount = 0

        summary.forEach(item => {
            if (item._id === 'income') {
                totalIncome = item.total
                incomeCount = item.count
            } else if (item._id === 'expense') {
                totalExpenses = item.total
                expenseCount = item.count
            }
        })

        const netAmount = totalIncome - totalExpenses

        res.json({
            summary: {
                totalIncome,
                totalExpenses,
                netAmount,
                incomeCount,
                expenseCount,
                totalTransactions: incomeCount + expenseCount
            }
        })
    } catch (error) {
        console.error('Get summary error:', error)
        res.status(500).json({
            error: 'Failed to fetch summary'
        })
    }
}

// Get expenses by category
export const getExpensesByCategory = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const { startDate, endDate } = req.query

        // Build date filter
        const dateFilter = {}
        if (startDate || endDate) {
            dateFilter.date = {}
            if (startDate) dateFilter.date.$gte = new Date(startDate)
            if (endDate) dateFilter.date.$lte = new Date(endDate)
        }

        const categoryData = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'expense',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            {
                $sort: { total: -1 }
            }
        ])

        // Calculate total for percentage calculation
        const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.total, 0)

        const categoriesWithPercentage = categoryData.map(cat => ({
            category: cat._id,
            amount: cat.total,
            count: cat.count,
            avgAmount: cat.avgAmount,
            percentage: totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(2) : 0
        }))

        res.json({
            categories: categoriesWithPercentage,
            totalExpenses
        })
    } catch (error) {
        console.error('Get expenses by category error:', error)
        res.status(500).json({
            error: 'Failed to fetch expenses by category'
        })
    }
}

// Get transactions by date (for trends)
export const getTransactionsByDate = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const { startDate, endDate, groupBy = 'day' } = req.query

        // Build date filter
        const dateFilter = {}
        if (startDate || endDate) {
            dateFilter.date = {}
            if (startDate) dateFilter.date.$gte = new Date(startDate)
            if (endDate) dateFilter.date.$lte = new Date(endDate)
        }

        // Group by format based on groupBy parameter
        let dateFormat
        switch (groupBy) {
            case 'month':
                dateFormat = { $dateToString: { format: '%Y-%m', date: '$date' } }
                break
            case 'week':
                dateFormat = { $dateToString: { format: '%Y-W%U', date: '$date' } }
                break
            case 'day':
            default:
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
                break
        }

        const trendData = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        date: dateFormat,
                        type: '$type'
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    income: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
                        }
                    },
                    expenses: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
                        }
                    },
                    incomeCount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'income'] }, '$count', 0]
                        }
                    },
                    expenseCount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$count', 0]
                        }
                    }
                }
            },
            {
                $addFields: {
                    date: '$_id',
                    netAmount: { $subtract: ['$income', '$expenses'] }
                }
            },
            {
                $sort: { date: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    income: 1,
                    expenses: 1,
                    netAmount: 1,
                    incomeCount: 1,
                    expenseCount: 1
                }
            }
        ])

        res.json({
            trends: trendData,
            groupBy
        })
    } catch (error) {
        console.error('Get transactions by date error:', error)
        res.status(500).json({
            error: 'Failed to fetch transaction trends'
        })
    }
}

// Get top spending categories
export const getTopCategories = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const { startDate, endDate, limit = 10 } = req.query

        // Build date filter
        const dateFilter = {}
        if (startDate || endDate) {
            dateFilter.date = {}
            if (startDate) dateFilter.date.$gte = new Date(startDate)
            if (endDate) dateFilter.date.$lte = new Date(endDate)
        }

        const topCategories = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'expense',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    lastTransaction: { $max: '$date' }
                }
            },
            {
                $sort: { total: -1 }
            },
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    category: '$_id',
                    amount: '$total',
                    count: 1,
                    avgAmount: 1,
                    lastTransaction: 1,
                    _id: 0
                }
            }
        ])

        res.json({
            topCategories
        })
    } catch (error) {
        console.error('Get top categories error:', error)
        res.status(500).json({
            error: 'Failed to fetch top categories'
        })
    }
}