import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            })
        }

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

export default auth