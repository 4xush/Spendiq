import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Category from '../models/Category.js'

dotenv.config()

const defaultCategories = [
    // Income Categories
    { name: 'Salary', type: 'income', color: '#10B981', icon: '💼', isDefault: true },
    { name: 'Business', type: 'income', color: '#059669', icon: '🏢', isDefault: true },
    { name: 'Investment', type: 'income', color: '#047857', icon: '📈', isDefault: true },
    { name: 'Gift', type: 'income', color: '#065F46', icon: '🎁', isDefault: true },
    { name: 'P2P Received', type: 'income', color: '#7C3AED', icon: '👥', isDefault: true },
    { name: 'Other Income', type: 'income', color: '#064E3B', icon: '💰', isDefault: true },

    // Expense Categories
    { name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: '🍽️', isDefault: true },
    { name: 'Groceries', type: 'expense', color: '#DC2626', icon: '🛒', isDefault: true },
    { name: 'Transportation', type: 'expense', color: '#B91C1C', icon: '🚗', isDefault: true },
    { name: 'Gas', type: 'expense', color: '#991B1B', icon: '⛽', isDefault: true },
    { name: 'Shopping', type: 'expense', color: '#7C2D12', icon: '🛍️', isDefault: true },
    { name: 'Entertainment', type: 'expense', color: '#A3A3A3', icon: '🎬', isDefault: true },
    { name: 'Bills & Utilities', type: 'expense', color: '#737373', icon: '📱', isDefault: true },
    { name: 'Healthcare', type: 'expense', color: '#525252', icon: '🏥', isDefault: true },
    { name: 'Travel', type: 'expense', color: '#404040', icon: '✈️', isDefault: true },
    { name: 'P2P Transfers', type: 'expense', color: '#8B5CF6', icon: '💸', isDefault: true },
    { name: 'Other', type: 'expense', color: '#262626', icon: '📝', isDefault: true }
]

async function seedCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB')

        // Remove existing default categories
        await Category.deleteMany({ isDefault: true })
        console.log('Removed existing default categories')

        // Insert new default categories
        await Category.insertMany(defaultCategories)
        console.log('Seeded default categories successfully')

        process.exit(0)
    } catch (error) {
        console.error('Error seeding categories:', error)
        process.exit(1)
    }
}

seedCategories()