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
        .withMessage('End date must be a valid ISO 8601 date'),
    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string'),
    query('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    query('categories')
        .optional()
        .isArray()
        .withMessage('Categories must be an array'),
    query('minAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Min amount must be a positive number'),
    query('maxAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Max amount must be a positive number')
]

// Helper function to build filters
const buildFilters = (userId, query) => {
    const { startDate, endDate, search, type, categories, minAmount, maxAmount } = query

    const filters = { userId }

    // Date filter
    if (startDate || endDate) {
        filters.date = {}
        if (startDate) filters.date.$gte = new Date(startDate)
        if (endDate) filters.date.$lte = new Date(endDate)
    }

    // Search filter (search in description and category)
    if (search) {
        filters.$or = [
            { description: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
        ]
    }

    // Type filter
    if (type) {
        filters.type = type
    }

    // Category filter
    if (categories) {
        let categoryArray = categories
        // Handle both array and comma-separated string
        if (typeof categories === 'string') {
            categoryArray = categories.split(',').map(cat => cat.trim()).filter(cat => cat)
        }
        if (Array.isArray(categoryArray) && categoryArray.length > 0) {
            filters.category = { $in: categoryArray }
        }
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
        filters.amount = {}
        if (minAmount !== undefined) filters.amount.$gte = parseFloat(minAmount)
        if (maxAmount !== undefined) filters.amount.$lte = parseFloat(maxAmount)
    }

    return filters
}

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
        const filters = buildFilters(userId, req.query)

        // Get summary data using aggregation
        const summary = await Transaction.aggregate([
            {
                $match: filters
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
        const filters = buildFilters(userId, req.query)

        // Ensure we only get expenses for this endpoint
        filters.type = 'expense'

        const categoryData = await Transaction.aggregate([
            {
                $match: filters
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
        const { groupBy = 'day' } = req.query
        const filters = buildFilters(userId, req.query)

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
                $match: filters
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
        const { limit = 10 } = req.query
        const filters = buildFilters(userId, req.query)

        // Ensure we only get expenses for this endpoint
        filters.type = 'expense'

        const topCategories = await Transaction.aggregate([
            {
                $match: filters
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
                    _id: 0,
                    category: '$_id',
                    amount: '$total',
                    count: 1,
                    avgAmount: 1,
                    lastTransaction: 1
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

// Get all available categories
export const getCategories = async (req, res) => {
    try {
        const userId = req.user._id

        const categories = await Transaction.distinct('category', { userId })

        res.json({
            categories: categories.filter(cat => cat) // Filter out null/undefined categories
        })
    } catch (error) {
        console.error('Get categories error:', error)
        res.status(500).json({
            error: 'Failed to fetch categories'
        })
    }
}

// Export analytics data
export const exportAnalytics = async (req, res) => {
    try {
        const userId = req.user._id
        const filters = buildFilters(userId, req.query)

        const transactions = await Transaction.find(filters)
            .select('date type amount description category')
            .sort({ date: -1 })
            .lean()

        // Format data for CSV
        const csvHeaders = ['Date', 'Type', 'Amount', 'Description', 'Category']
        const csvRows = transactions.map(t => [
            t.date.toISOString().split('T')[0],
            t.type,
            t.amount,
            t.description || '',
            t.category || ''
        ])

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row =>
                row.map(field =>
                    typeof field === 'string' && field.includes(',')
                        ? `"${field}"`
                        : field
                ).join(',')
            )
        ].join('\n')

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv')
        res.send(csvContent)
    } catch (error) {
        console.error('Export analytics error:', error)
        res.status(500).json({
            error: 'Failed to export analytics data'
        })
    }
}