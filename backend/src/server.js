import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import session from 'express-session'

import connectDB from './config/database.js'
import './config/redisClient.js'
import './config/passport.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import categoryRoutes from './routes/categories.js'
import fileRoutes from './routes/files.js'
import analyticsRoutes from './routes/analytics.js'
import errorHandler from './middleware/errorHandler.js'

// Load environment variables
dotenv.config()

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error.name, error.message)
    console.error('Stack:', error.stack)
    // Log the error but don't exit in development
    if (process.env.NODE_ENV === 'production') {
        console.error('🛑 Shutting down server due to uncaught exception')
        process.exit(1)
    }
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason)

    // Handle specific known issues
    if (reason && reason.name === 'DataCloneError') {
        console.error('🔧 DataCloneError caught - this is a known Tesseract.js worker issue')
        return // Don't exit for DataCloneError as it's handled in the OCR service
    }

    // Log the error but don't exit in development
    if (process.env.NODE_ENV === 'production') {
        console.error('🛑 Shutting down server due to unhandled rejection')
        process.exit(1)
    }
})

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Connect to Database
connectDB()

// Security Middleware
app.use(helmet())
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}))

// Rate limiting - configurable by environment
const isProduction = process.env.NODE_ENV === 'production'
const enableRateLimit = process.env.ENABLE_RATE_LIMIT === 'true' || isProduction

if (enableRateLimit) {
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            error: 'Too many requests from this IP, please try again later'
        }
    })
    app.use('/api/', limiter)
    console.log(` Rate limiting enabled: ${parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 60000} minutes`)
} else {
    console.log('Rate limiting disabled for development mode')
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Cookie parser middleware
app.use(cookieParser())

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'keyboardcat',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // must be true on Render (uses HTTPS)
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        },
    })
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/analytics', analyticsRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

// Redis cache test endpoint
app.get('/api/cache/test', async (req, res) => {
    try {
        const { client, setCache, getCache } = await import('./config/redisClient.js')

        // Test if Redis client is connected
        if (client.status !== 'ready') {
            return res.status(500).json({
                status: 'error',
                message: 'Redis client is not connected',
                connectionStatus: client.status
            })
        }

        // Test set operation
        const testKey = 'test:connection'
        const testValue = {
            message: 'Redis cache is working',
            timestamp: new Date().toISOString()
        }

        await setCache(testKey, testValue, 60) // 60 second TTL

        // Test get operation
        const cachedValue = await getCache(testKey)

        res.json({
            status: 'success',
            message: 'Redis cache test successful',
            cached: cachedValue
        })
    } catch (error) {
        console.error('Redis test error:', error)
        res.status(500).json({
            status: 'error',
            message: 'Redis cache test failed',
            error: error.message
        })
    }
})

// Root route for Render deployment testing
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Spendiq API is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime() / 60)} minutes, ${Math.floor(process.uptime() % 60)} seconds`
    })
})

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    })
})

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})