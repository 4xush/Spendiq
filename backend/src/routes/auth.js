import express from 'express'
import passport from 'passport'
import {
    register,
    login,
    getProfile,
    updateProfile,
    googleCallback,
    loginValidation,
    logout
} from '../controllers/authController.js'
import auth from '../middleware/auth.js'
import cacheMiddleware from '../middleware/cache.js'
import invalidateCacheMiddleware from '../middleware/cacheInvalidation.js'

const router = express.Router()

// Public routes
router.post('/login', loginValidation, login)

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
    passport.authenticate('google', { session: true, failureRedirect: '/login' }),
    googleCallback
)

// Protected routes
router.get('/profile',
    auth,
    cacheMiddleware('auth:profile', 60 * 2, // Cache for 2 minutes
        (req) => `auth:profile:${req.user._id}`
    ),
    getProfile
)
router.put('/profile',
    auth,
    invalidateCacheMiddleware(['auth:profile:*']),
    updateProfile)

// Logout route
router.post('/logout',
    auth,
    invalidateCacheMiddleware(['auth:profile:*']),
    logout)

export default router