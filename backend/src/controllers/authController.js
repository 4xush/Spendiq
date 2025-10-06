import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'

// Register validation rules
export const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
]

// Login validation rules
export const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
]

// Register user
export const register = async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const { name, email, password } = req.body

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                error: 'User with this email already exists'
            })
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        })

        await user.save()

        // Generate JWT token
        const token = generateToken(user._id)

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences
            }
        })
    } catch (error) {
        console.error('Registration error:', error)
        res.status(500).json({
            error: 'Failed to register user'
        })
    }
}

// Login user
export const login = async (req, res) => {
    try {
        // Check validation results
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            })
        }

        const { email, password } = req.body

        // Find user by email
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                error: 'Invalid credentials'
            })
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(400).json({
                error: 'Invalid credentials'
            })
        }

        // Generate JWT token
        const token = generateToken(user._id)

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            error: 'Failed to login'
        })
    }
}

// Get user profile
export const getProfile = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                preferences: req.user.preferences,
                createdAt: req.user.createdAt
            }
        })
    } catch (error) {
        console.error('Get profile error:', error)
        res.status(500).json({
            error: 'Failed to get profile'
        })
    }
}

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, preferences } = req.body
        const userId = req.user._id

        const updateData = {}
        if (name) updateData.name = name.trim()
        if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password')

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences
            }
        })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({
            error: 'Failed to update profile'
        })
    }
}