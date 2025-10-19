import jwt from 'jsonwebtoken'
import passport from 'passport'
import User from '../models/User.js'

// Authentication middleware using both JWT and Passport
const auth = async (req, res, next) => {
    try {
        // Check for token in Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '') ||
            req.cookies?.auth_token // Also check for token in cookies

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            })
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')

        if (!user) {
            return res.status(401).json({
                error: 'Token is not valid. User not found.'
            })
        }

        req.user = user
        next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token is not valid.'
            })
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token has expired.'
            })
        }

        res.status(500).json({
            error: 'Server error during authentication.'
        })
    }
}

// Middleware to authenticate using Google OAuth
const googleAuth = passport.authenticate('google', { session: false })

export default auth
export { googleAuth }