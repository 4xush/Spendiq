import Category from '../models/Category.js'
import { body, validationResult } from 'express-validator'

// Category validation rules
export const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Category name is required and must not exceed 30 characters'),
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
    body('color')
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage('Color must be a valid hex color'),
    body('icon')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Icon is required')
]

// Get categories for user (including defaults)
export const getCategories = async (req, res) => {
    try {
        const userId = req.user._id
        const { type } = req.query

        const categories = await Category.getForUser(userId, type)

        res.json({
            categories
        })
    } catch (error) {
        console.error('Get categories error:', error)
        res.status(500).json({
            error: 'Failed to fetch categories'
        })
    }
}

// Create custom category
export const createCategory = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const userId = req.user._id
        const { name, type, color, icon } = req.body

        // Check if category already exists for this user
        const existingCategory = await Category.findOne({
            name: name.trim(),
            type,
            $or: [
                { userId },
                { isDefault: true }
            ]
        })

        if (existingCategory) {
            return res.status(400).json({
                error: 'Category with this name already exists'
            })
        }

        const category = new Category({
            name: name.trim(),
            type,
            color,
            icon,
            userId,
            isDefault: false
        })

        await category.save()

        res.status(201).json({
            message: 'Category created successfully',
            category
        })
    } catch (error) {
        console.error('Create category error:', error)
        res.status(500).json({
            error: 'Failed to create category'
        })
    }
}

// Update custom category
export const updateCategory = async (req, res) => {
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

        // Only allow updating custom categories (not default ones)
        const category = await Category.findOne({
            _id: id,
            userId,
            isDefault: false
        })

        if (!category) {
            return res.status(404).json({
                error: 'Category not found or cannot be updated'
            })
        }

        // Check for duplicate name if name is being changed
        if (req.body.name && req.body.name !== category.name) {
            const existingCategory = await Category.findOne({
                name: req.body.name.trim(),
                type: req.body.type || category.type,
                $or: [
                    { userId },
                    { isDefault: true }
                ]
            })

            if (existingCategory) {
                return res.status(400).json({
                    error: 'Category with this name already exists'
                })
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            {
                ...req.body,
                name: req.body.name?.trim()
            },
            { new: true, runValidators: true }
        )

        res.json({
            message: 'Category updated successfully',
            category: updatedCategory
        })
    } catch (error) {
        console.error('Update category error:', error)
        res.status(500).json({
            error: 'Failed to update category'
        })
    }
}

// Delete custom category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id

        // Only allow deleting custom categories (not default ones)
        const category = await Category.findOne({
            _id: id,
            userId,
            isDefault: false
        })

        if (!category) {
            return res.status(404).json({
                error: 'Category not found or cannot be deleted'
            })
        }

        await Category.findByIdAndDelete(id)

        res.json({
            message: 'Category deleted successfully'
        })
    } catch (error) {
        console.error('Delete category error:', error)
        res.status(500).json({
            error: 'Failed to delete category'
        })
    }
}