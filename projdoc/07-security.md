# 🔐 Security & Authentication

## 🛡️ Security Architecture Overview

```mermaid
graph TB
    A[Client Request] --> B[HTTPS/TLS]
    B --> C[CORS Policy]
    C --> D[Helmet Security]
    D --> E[Rate Limiting]
    E --> F[JWT Authentication]
    F --> G[Input Validation]
    G --> H[Data Sanitization]
    H --> I[Authorization Check]
    I --> J[Business Logic]
    J --> K[Database Security]
    
    style B fill:#ff5722
    style F fill:#2196f3
    style G fill:#4caf50
    style K fill:#9c27b0
```

## 🔑 Authentication System

### JWT Token Implementation
```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant DB as Database
    participant M as Middleware
    
    C->>A: POST /auth/login
    A->>A: Validate Credentials
    A->>DB: Verify User
    DB-->>A: User Data
    A->>A: Generate JWT Token
    A-->>C: JWT + User Info
    
    C->>M: Request with JWT
    M->>M: Verify JWT
    M->>M: Extract User ID
    M-->>C: Authorized Request
```

### JWT Configuration
```javascript
// backend/src/utils/jwt.js
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
    issuer: 'personal-finance-app',
    audience: 'app-users'
};

export const generateToken = (userId) => {
    return jwt.sign(
        { userId, type: 'access' },
        JWT_CONFIG.secret,
        {
            expiresIn: JWT_CONFIG.expiresIn,
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        }
    );
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_CONFIG.secret, {
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });
    } catch (error) {
        throw new Error('Invalid token');
    }
};
```

### Authentication Middleware
```javascript
// backend/src/middleware/auth.js
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify JWT token
        const decoded = verifyToken(token);
        
        // Check if user exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                error: 'Invalid token. User not found.'
            });
        }

        // Attach user to request
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        res.status(401).json({
            error: 'Invalid token',
            details: error.message
        });
    }
};
```

## 🔒 Password Security

### Password Hashing Strategy
```mermaid
flowchart TD
    A[User Password] --> B[Salt Generation]
    B --> C[bcrypt.hash()]
    C --> D[12 Rounds]
    D --> E[Hashed Password]
    E --> F[Store in Database]
    
    G[Login Attempt] --> H[bcrypt.compare()]
    H --> I[Hash Comparison]
    I --> J{Match?}
    J -->|Yes| K[Authentication Success]
    J -->|No| L[Authentication Failed]
```

### Password Implementation
```javascript
// In User model (backend/src/models/User.js)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        // Generate salt with 12 rounds (high security)
        const salt = await bcrypt.genSalt(12);
        
        // Hash password with salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
```

### Password Policy
```javascript
// Password validation rules
const passwordValidation = [
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];
```

## 🚫 Input Validation & Sanitization

### Validation Layers
```mermaid
graph LR
    A[User Input] --> B[Client Validation]
    B --> C[Server Validation]
    C --> D[Schema Validation]
    D --> E[Database Validation]
    
    B --> B1[React Hook Form]
    C --> C1[Express Validator]
    D --> D1[Mongoose Schema]
    E --> E1[MongoDB Constraints]
```

### Express Validator Implementation
```javascript
// backend/src/controllers/transactionController.js
export const transactionValidation = [
    body('type')
        .isIn(['income', 'expense', 'transfer'])
        .withMessage('Type must be either income, expense, or transfer'),
    
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number')
        .customSanitizer(value => Math.round(value * 100) / 100), // Round to 2 decimals
    
    body('category')
        .trim()
        .escape() // Escape HTML characters
        .isLength({ min: 1, max: 30 })
        .withMessage('Category is required and must not exceed 30 characters'),
    
    body('description')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 200 })
        .withMessage('Description must not exceed 200 characters'),
    
    body('date')
        .isISO8601()
        .toDate() // Convert to Date object
        .withMessage('Date must be a valid ISO 8601 date'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    
    body('tags.*')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 20 })
        .withMessage('Each tag must not exceed 20 characters')
];

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};
```

### File Upload Security
```javascript
// backend/src/middleware/upload.js
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate secure filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Single file upload
    }
});
```

## 🛡️ Security Headers & CORS

### Helmet Security Configuration
```javascript
// backend/src/server.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // For development
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

### CORS Configuration
```javascript
// CORS settings
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL
        ];
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## ⚡ Rate Limiting

### Rate Limiting Strategy
```mermaid
graph TD
    A[Rate Limiter] --> B[IP-based Limiting]
    A --> C[User-based Limiting]
    A --> D[Endpoint-specific Limits]
    
    B --> B1[100 req/15min per IP]
    C --> C1[1000 req/hour per user]
    D --> D1[File upload: 10/hour]
    D --> D2[Auth: 5 attempts/15min]
    D --> D3[Analytics: 50/10min]
```

### Rate Limiting Implementation
```javascript
// backend/src/server.js
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise IP
            return req.user?.id || req.ip;
        }
    });
};

// General API rate limiting
const generalLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later'
);

// Authentication rate limiting
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    'Too many authentication attempts, please try again later'
);

// File upload rate limiting
const uploadLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // limit each user to 10 uploads per hour
    'Too many file uploads, please try again later'
);

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/files/upload', uploadLimiter);
```

## 🔐 Authorization & Access Control

### Role-Based Access Control
```mermaid
graph LR
    A[User Request] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Resource Owner?}
    D -->|No| E[403 Forbidden]
    D -->|Yes| F[Allow Access]
    
    G[Admin Role] --> H[All Resources]
    I[User Role] --> J[Own Resources Only]
```

### Authorization Middleware
```javascript
// Resource ownership verification
const checkResourceOwnership = (resourceModel) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const userId = req.user._id;
            
            const resource = await resourceModel.findById(resourceId);
            
            if (!resource) {
                return res.status(404).json({
                    error: 'Resource not found'
                });
            }
            
            // Check if user owns the resource
            if (resource.userId.toString() !== userId.toString()) {
                return res.status(403).json({
                    error: 'Access denied. You can only access your own resources.'
                });
            }
            
            req.resource = resource;
            next();
        } catch (error) {
            res.status(500).json({
                error: 'Authorization check failed'
            });
        }
    };
};

// Usage in routes
router.get('/transactions/:id', 
    auth, 
    checkResourceOwnership(Transaction), 
    getTransaction
);
```

## 🗄️ Database Security

### MongoDB Security Measures
```mermaid
graph TD
    A[Database Security] --> B[Connection Security]
    A --> C[Query Protection]
    A --> D[Data Encryption]
    A --> E[Access Control]
    
    B --> B1[MongoDB URI with Auth]
    B --> B2[Connection Pooling]
    B --> B3[SSL/TLS Connection]
    
    C --> C1[NoSQL Injection Prevention]
    C --> C2[Input Sanitization]
    C --> C3[Parameterized Queries]
    
    D --> D1[Encryption at Rest]
    D --> D2[Field-level Encryption]
    
    E --> E1[User Isolation]
    E --> E2[Database Indexes]
```

### NoSQL Injection Prevention
```javascript
// Sanitize MongoDB queries
const sanitizeQuery = (query) => {
    if (typeof query !== 'object' || query === null) {
        return query;
    }
    
    const sanitized = {};
    for (const key in query) {
        if (query.hasOwnProperty(key)) {
            // Remove MongoDB operators from user input
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }
            sanitized[key] = query[key];
        }
    }
    return sanitized;
};

// Example usage in controller
const listTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const filters = sanitizeQuery(req.query);
        
        // Build safe query
        const query = { userId };
        
        // Add sanitized filters
        if (filters.category) {
            query.category = { $regex: new RegExp(filters.category, 'i') };
        }
        
        const transactions = await Transaction.find(query);
        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ error: 'Query failed' });
    }
};
```

## 🔍 Security Monitoring & Logging

### Security Event Logging
```javascript
// Security event logger
class SecurityLogger {
    static logAuthAttempt(req, success, userId = null) {
        const logData = {
            event: 'auth_attempt',
            success,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId,
            timestamp: new Date()
        };
        
        console.log('Security Event:', JSON.stringify(logData));
    }
    
    static logSuspiciousActivity(req, reason) {
        const logData = {
            event: 'suspicious_activity',
            reason,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            method: req.method,
            timestamp: new Date()
        };
        
        console.log('Security Alert:', JSON.stringify(logData));
    }
}

// Usage in authentication
const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        
        if (!user || !await user.comparePassword(req.body.password)) {
            SecurityLogger.logAuthAttempt(req, false);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        SecurityLogger.logAuthAttempt(req, true, user._id);
        
        const token = generateToken(user._id);
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
```

## 🔧 Environment Security

### Environment Variables
```bash
# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here

# Database Security
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
MONGODB_SSL=true

# API Keys (encrypted)
GEMINI_API_KEY=encrypted_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_RATE_LIMIT=true

# File Security
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# CORS Security
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Security Headers
ENABLE_HTTPS_REDIRECT=true
HSTS_MAX_AGE=31536000
```

## 🚨 Security Best Practices

### Implementation Checklist
- ✅ **Authentication**: JWT tokens with secure secrets
- ✅ **Authorization**: Resource ownership verification
- ✅ **Input Validation**: Multi-layer validation and sanitization
- ✅ **Password Security**: bcrypt with 12 rounds
- ✅ **Rate Limiting**: IP and user-based limits
- ✅ **CORS**: Restricted origins and methods
- ✅ **Security Headers**: Helmet.js configuration
- ✅ **File Upload Security**: Type and size validation
- ✅ **NoSQL Injection Prevention**: Query sanitization
- ✅ **Error Handling**: No sensitive data exposure
- ✅ **Logging**: Security events and suspicious activity
- ✅ **Environment Security**: Encrypted secrets and variables

### Security Monitoring
- 🔍 **Failed Authentication Attempts**
- 🔍 **Rate Limit Violations**
- 🔍 **Suspicious File Uploads**
- 🔍 **Unauthorized Access Attempts**
- 🔍 **SQL/NoSQL Injection Attempts**
- 🔍 **Unusual Traffic Patterns**

---

*This security implementation ensures robust protection for user data and application integrity while maintaining usability.*