import express from 'express'
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    categoryValidation
} from '../controllers/categoryController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// All category routes require authentication
router.use(auth)

router.get('/', getCategories)
router.post('/', categoryValidation, createCategory)
router.put('/:id', categoryValidation, updateCategory)
router.delete('/:id', deleteCategory)

export default router