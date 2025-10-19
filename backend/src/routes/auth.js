import express from 'express'
import passport from 'passport'
import {
    register,
    login,
    getProfile,
    updateProfile,
    googleCallback,
    loginValidation
} from '../controllers/authController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/login', loginValidation, login)

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
)

// Protected routes
router.get('/profile', auth, getProfile)
router.put('/profile', auth, updateProfile)

export default router