import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'

// Register validation rules - kept for reference but not used anymore
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

// Register user - DISABLED
export const register = async (req, res) => {
    // Temporarily disabled - only Google OAuth registration is allowed
    return res.status(403).json({
        error: 'Direct registration is disabled. Please sign up with Google.'
    });
}

// Handle Google OAuth callback
export const googleCallback = async (req, res) => {
    try {
        // User is already attached to req by passport
        const token = generateToken(req.user._id);

        // Set token in cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}`);
    } catch (error) {
        console.error('Google auth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
};

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

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            })
        }

        // For users created with Google OAuth, prevent password login
        if (user.authType === 'google' && !user.password) {
            return res.status(400).json({
                error: 'This account was created with Google. Please sign in with Google.'
            })
        }
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

// Logout user
export const logout = async (req, res) => {
    try {
        // In a stateless JWT auth system, we don't need to do anything server-side
        // except invalidate any server-side caches

        // Clear auth cookies if they exist
        res.clearCookie('auth_token');

        res.json({
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Failed to logout'
        });
    }
}