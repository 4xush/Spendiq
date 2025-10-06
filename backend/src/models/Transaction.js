import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    source: {
        type: String,
        enum: ['manual', 'receipt', 'pdf'],
        default: 'manual'
    },
    receiptUrl: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        confidence: Number, // AI confidence score for auto-categorized transactions
        originalText: String, // Original OCR text for receipts
        merchant: String,
        location: String
    }
}, {
    timestamps: true
})

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 })
transactionSchema.index({ userId: 1, type: 1, date: -1 })
transactionSchema.index({ userId: 1, category: 1, date: -1 })

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function () {
    return this.type === 'expense' ? -this.amount : this.amount
})

// Static method to get transactions with pagination
transactionSchema.statics.getPaginated = function (userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        type,
        category,
        startDate,
        endDate,
        search
    } = options

    const query = { userId }

    // Add filters
    if (type) query.type = type
    if (category) query.category = category
    if (startDate || endDate) {
        query.date = {}
        if (startDate) query.date.$gte = new Date(startDate)
        if (endDate) query.date.$lte = new Date(endDate)
    }
    if (search) {
        query.$or = [
            { description: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { 'metadata.merchant': { $regex: search, $options: 'i' } }
        ]
    }

    const skip = (page - 1) * limit

    return this.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
}

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction