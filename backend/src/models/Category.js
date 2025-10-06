import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [30, 'Category name cannot exceed 30 characters']
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Category type is required']
    },
    color: {
        type: String,
        required: [true, 'Category color is required'],
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
    },
    icon: {
        type: String,
        required: [true, 'Category icon is required'],
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () {
            return !this.isDefault
        }
    }
}, {
    timestamps: true
})

// Ensure unique category names per user per type
categorySchema.index({ name: 1, type: 1, userId: 1 }, { unique: true })
categorySchema.index({ name: 1, type: 1, isDefault: 1 }, {
    unique: true,
    partialFilterExpression: { isDefault: true }
})

// Static method to get categories for a user (including defaults)
categorySchema.statics.getForUser = function (userId, type = null) {
    const query = {
        $or: [
            { isDefault: true },
            { userId: userId }
        ]
    }

    if (type) {
        query.type = type
    }

    return this.find(query).sort({ isDefault: -1, name: 1 })
}

const Category = mongoose.model('Category', categorySchema)

export default Category