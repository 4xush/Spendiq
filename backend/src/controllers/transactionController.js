import { body, query, validationResult } from 'express-validator'
import Transaction from '../models/Transaction.js'
import Category from '../models/Category.js'

// Transaction validation rules
export const transactionValidation = [
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
    body('category')
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Category is required and must not exceed 30 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description must not exceed 200 characters'),
    body('date')
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Each tag must not exceed 20 characters')
]

// List transactions validation
export const listValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
]

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const transactionData = {
            ...req.body,
            userId
        }

        const transaction = new Transaction(transactionData)
        await transaction.save()

        // Populate user data
        await transaction.populate('userId', 'name email')

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction
        })
    } catch (error) {
        console.error('Create transaction error:', error)
        res.status(500).json({
            error: 'Failed to create transaction'
        })
    }
}

// List transactions with pagination and filters
export const listTransactions = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const {
            page = 1,
            limit = 20,
            type,
            category,
            startDate,
            endDate,
            search
        } = req.query

        // Get paginated transactions
        const transactions = await Transaction.getPaginated(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            type,
            category,
            startDate,
            endDate,
            search
        })

        // Get total count for pagination
        const query = { userId }
        if (type) query.type = type
        if (category) query.category = category
        if (startDate || endDate) {
            query.date = {}
            if (startDate) {
                // Set to start of day
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                query.date.$gte = start
            }
            if (endDate) {
                // Set to end of day to include all transactions on end date
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                query.date.$lte = end
            }
        }
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { 'metadata.merchant': { $regex: search, $options: 'i' } }
            ]
        }

        const total = await Transaction.countDocuments(query)
        const totalPages = Math.ceil(total / parseInt(limit))

        res.json({
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        })
    } catch (error) {
        console.error('List transactions error:', error)
        res.status(500).json({
            error: 'Failed to fetch transactions'
        })
    }
}

// Get single transaction
export const getTransaction = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id

        const transaction = await Transaction.findOne({ _id: id, userId })
            .populate('userId', 'name email')

        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found'
            })
        }

        res.json({
            transaction
        })
    } catch (error) {
        console.error('Get transaction error:', error)
        res.status(500).json({
            error: 'Failed to fetch transaction'
        })
    }
}

// Update transaction
export const updateTransaction = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const { id } = req.params
        const userId = req.user._id

        const transaction = await Transaction.findOneAndUpdate(
            { _id: id, userId },
            req.body,
            { new: true, runValidators: true }
        ).populate('userId', 'name email')

        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found'
            })
        }

        res.json({
            message: 'Transaction updated successfully',
            transaction
        })
    } catch (error) {
        console.error('Update transaction error:', error)
        res.status(500).json({
            error: 'Failed to update transaction'
        })
    }
}

// Delete transaction
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id

        const transaction = await Transaction.findOneAndDelete({ _id: id, userId })

        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found'
            })
        }

        res.json({
            message: 'Transaction deleted successfully'
        })
    } catch (error) {
        console.error('Delete transaction error:', error)
        res.status(500).json({
            error: 'Failed to delete transaction'
        })
    }
}