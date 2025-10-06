import mongoose from 'mongoose'

const receiptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    originalFilename: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    ocrText: {
        type: String,
        trim: true
    },
    extractedData: {
        amount: Number,
        merchant: String,
        date: Date,
        category: String,
        items: [{
            name: String,
            quantity: Number,
            price: Number
        }]
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    error: {
        message: String,
        details: String
    }
}, {
    timestamps: true
})

const Receipt = mongoose.model('Receipt', receiptSchema)

export default Receipt