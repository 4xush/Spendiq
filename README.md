# 💰 Spendiq - AI-Powered Personal Finance Manager

<div align="center">

![Spendiq Logo](https://img.shields.io/badge/Spendiq-Finance%20Manager-blue?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

**A comprehensive MERN stack application for personal finance management with AI-powered receipt processing, bank statement analysis, and intelligent analytics.**

[🚀 Live Demo](#) • [📖 Documentation](#-api-documentation) • [🤝 Contributing](https://github.com/4xush/Spendiq.git) • [🐛 Report Bug](#-troubleshooting)

</div>

---

## 🌟 Features

### 🤖 AI-Powered Intelligence

- **Smart Receipt Processing**: Extract transaction data from photos using Google Gemini AI
- **Bank Statement Analysis**: Parse PDF statements and auto-import transactions
- **Intelligent Categorization**: AI-powered transaction categorization
- **Financial Insights**: Get personalized spending recommendations

### 💳 Transaction Management

- **Complete CRUD Operations**: Create, view, edit, and delete transactions
- **Advanced Filtering**: Filter by date range, category, amount, and type
- **Smart Search**: Search across descriptions, merchants, and categories
- **Bulk Operations**: Select and manage multiple transactions

### 📊 Analytics & Visualization

- **Interactive Dashboards**: Mobile-optimized financial overview
- **Spending Trends**: Beautiful charts showing income/expense patterns
- **Category Breakdown**: Detailed analysis of spending by category
- **P2P Tracking**: Monitor money lent, borrowed, and shared

### 🎯 Person-to-Person (P2P) Features

- **P2P Transaction Tracking**: Track money with friends and family
- **Status Management**: Pending, completed, overdue status tracking
- **Contact Integration**: Link transactions to contacts
- **Due Date Reminders**: Never forget to collect or pay back money

### 📱 Modern User Experience

- **Mobile-First Design**: Optimized for all screen sizes
- **Real-time Updates**: Instant feedback and notifications
- **Drag & Drop Uploads**: Intuitive file upload interface
- **Minimal UI**: Clean, rounded design with smooth animations

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-4.0-646CFF?style=flat&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-06B6D4?style=flat&logo=tailwindcss)
![React Router](https://img.shields.io/badge/React%20Router-6-CA4245?style=flat&logo=reactrouter)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-47A248?style=flat&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens)

### AI & Processing

![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat&logo=google)
![Tesseract.js](https://img.shields.io/badge/Tesseract.js-OCR-FF6B6B?style=flat)

</div>

**Frontend Libraries:**

- **React 18** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Responsive charting library
- **React Router** - Declarative routing
- **Axios** - Promise-based HTTP client
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Beautiful & consistent icons

**Backend Stack:**

- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL document database
- **Mongoose** - Elegant MongoDB object modeling
- **JWT** - Secure authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **Express Rate Limit** - Rate limiting middleware

**AI Integration:**

- **Google Gemini API** - Advanced AI for text processing
- **pdf-parse** - PDF text extraction
- **Sharp** - Image processing

---

## 📋 Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)

### Optional but Recommended:

- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing tool
- **VS Code** - Code editor with extensions

---

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/4xush/Spendiq.git
cd Spendiq
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# OR create .env file manually
```

**Backend Environment Variables** (`.env`):

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/personal_finance

# JWT Configuration
JWT_SECRET=punisherishere
JWT_EXPIRES_IN=7d

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OCR Configuration
OCR_TIMEOUT_MS=60000
OCR_MAX_FILE_SIZE_MB=10

# Timezone Configuration
TZ=Asia/Kolkata

# Security Configuration
BCRYPT_SALT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-too
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# OR create .env file manually
```

**Frontend Environment Variables** (`.env`):

```env
VITE_BACKEND_URL=http://localhost:5000/api
```

### 4. Google Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Replace `your_gemini_api_key_here` in backend `.env` file

### 5. Database Setup

**Option A: Local MongoDB**

```bash
# Start MongoDB service
mongod

# Optional: Seed default categories
cd backend
npm run seed
```

**Option B: MongoDB Atlas (Cloud)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 6. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### 7. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🏗️ Build for Production

### Frontend Build

```bash
cd frontend
npm run build
```

### Backend Production

```bash
cd backend
npm start
```

### Environment Setup for Production

- Update `NODE_ENV=production` in backend `.env`
- Update `VITE_BACKEND_URL` to your production API URL
- Use production MongoDB database
- Ensure proper security configurations

---

## 📊 API Documentation

### 🔐 Authentication Endpoints

| Method | Endpoint             | Description         | Auth Required |
| ------ | -------------------- | ------------------- | ------------- |
| `POST` | `/api/auth/register` | Register new user   | ❌            |
| `POST` | `/api/auth/login`    | Login user          | ❌            |
| `GET`  | `/api/auth/profile`  | Get user profile    | ✅            |
| `PUT`  | `/api/auth/profile`  | Update user profile | ✅            |

### 💳 Transaction Endpoints

| Method   | Endpoint                | Description                         | Auth Required |
| -------- | ----------------------- | ----------------------------------- | ------------- |
| `GET`    | `/api/transactions`     | List transactions (with pagination) | ✅            |
| `POST`   | `/api/transactions`     | Create new transaction              | ✅            |
| `GET`    | `/api/transactions/:id` | Get single transaction              | ✅            |
| `PUT`    | `/api/transactions/:id` | Update transaction                  | ✅            |
| `DELETE` | `/api/transactions/:id` | Delete transaction                  | ✅            |

### 🤝 P2P Transaction Endpoints

| Method  | Endpoint                           | Description            | Auth Required |
| ------- | ---------------------------------- | ---------------------- | ------------- |
| `GET`   | `/api/transactions/p2p`            | List P2P transactions  | ✅            |
| `POST`  | `/api/transactions/p2p`            | Create P2P transaction | ✅            |
| `GET`   | `/api/transactions/p2p/summary`    | Get P2P summary        | ✅            |
| `PATCH` | `/api/transactions/p2p/:id/status` | Update P2P status      | ✅            |

### 📁 File Processing Endpoints

| Method | Endpoint                 | Description                        | Auth Required |
| ------ | ------------------------ | ---------------------------------- | ------------- |
| `POST` | `/api/files/receipt`     | Upload and process receipt         | ✅            |
| `POST` | `/api/files/pdf`         | Upload and process PDF statement   | ✅            |
| `POST` | `/api/files/image`       | Upload and process image statement | ✅            |
| `GET`  | `/api/files/receipt/:id` | Get receipt processing status      | ✅            |

### 📈 Analytics Endpoints

| Method | Endpoint                        | Description             | Auth Required |
| ------ | ------------------------------- | ----------------------- | ------------- |
| `GET`  | `/api/analytics/summary`        | Financial summary       | ✅            |
| `GET`  | `/api/analytics/by-category`    | Expenses by category    | ✅            |
| `GET`  | `/api/analytics/by-date`        | Transactions by date    | ✅            |
| `GET`  | `/api/analytics/top-categories` | Top spending categories | ✅            |

### 🏷️ Category Endpoints

| Method   | Endpoint                       | Description            | Auth Required |
| -------- | ------------------------------ | ---------------------- | ------------- |
| `GET`    | `/api/transactions/categories` | Get all categories     | ✅            |
| `POST`   | `/api/categories`              | Create custom category | ✅            |
| `PUT`    | `/api/categories/:id`          | Update custom category | ✅            |
| `DELETE` | `/api/categories/:id`          | Delete custom category | ✅            |

---

## 🎯 Usage Guide

### 📱 Adding Transactions

1. **Navigate** to the Transactions page
2. **Click** "Add Transaction" button
3. **Fill** in transaction details:
   - Description/Merchant name
   - Amount
   - Date
   - Category (auto-suggested)
   - Type (Income/Expense)
4. **Save** the transaction

### 📄 Processing Receipts

1. **Go** to Upload page
2. **Select** "Receipt Upload" tab
3. **Upload** receipt image (JPG, PNG, WebP)
4. **Wait** for AI processing
5. **Review** extracted data:
   - Merchant name
   - Amount
   - Date
   - Items (if available)
6. **Accept** or **Edit** the transaction
7. **Confirm** to add to your records

### 📊 Bank Statement Import

1. **Navigate** to Upload page
2. **Select** "Statement" tab
3. **Choose** format (PDF or Image)
4. **Upload** your bank statement
5. **Review** extracted transactions
6. **Bulk confirm** or review individually
7. **Import** selected transactions

### 🤝 P2P Transaction Management

1. **Visit** P2P Dashboard
2. **Click** "Add P2P Transaction"
3. **Fill** details:
   - Person name
   - Amount
   - Transaction type (Lent/Borrowed/Gift/Payment)
   - Due date (optional)
   - Contact info (optional)
   - Notes
4. **Track** status (Pending/Completed/Overdue)
5. **Update** status as needed

### 📈 Viewing Analytics

1. **Navigate** to Analytics page
2. **Select** date ranges using filters
3. **View** different insights:
   - **General**: Overall summary and trends
   - **P2P**: Person-to-person analytics
4. **Export** data as needed
5. **Get** AI-powered insights

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Transaction CRUD operations
- [ ] Receipt upload and processing
- [ ] PDF statement import
- [ ] P2P transaction management
- [ ] Analytics data visualization
- [ ] Responsive design on mobile
- [ ] File upload validation
- [ ] Error handling

---

## 🔒 Security Features

### 🛡️ Authentication & Authorization

- **JWT Tokens** with secure expiration
- **Password Hashing** using bcrypt (12 salt rounds)
- **Route Protection** with middleware
- **User Data Isolation** per authenticated user

### 🔐 Data Protection

- **Input Validation** with express-validator
- **File Upload Validation** (type, size, format)
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Configuration** for specific origins
- **Security Headers** with Helmet

### 🚨 Error Handling

- **Graceful Error Responses** with proper status codes
- **Input Sanitization** to prevent injection attacks
- **File Size Limits** to prevent DoS attacks
- **Timeout Handling** for long-running operations

---

## 🚀 Deployment Guide

### 🌐 Frontend Deployment (Vercel/Netlify)

**Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**Netlify:**

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variable: `VITE_BACKEND_URL`

### 🖥️ Backend Deployment (Railway/Render/Heroku)

**Railway:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd backend
railway login
railway init
railway up
```

**Environment Variables for Production:**

- Set all backend `.env` variables
- Use production MongoDB URI
- Update `FRONTEND_URL` to production domain

### 🗄️ Database Deployment (MongoDB Atlas)

1. **Create** [MongoDB Atlas](https://www.mongodb.com/atlas) account
2. **Create** new cluster
3. **Configure** network access (0.0.0.0/0 for now)
4. **Create** database user
5. **Get** connection string
6. **Update** `MONGODB_URI` in production environment

---

## ⚡ Performance Optimizations

### 🎯 Frontend Optimizations

- **Code Splitting** with React Router
- **Lazy Loading** for heavy components
- **Image Optimization** with proper formats
- **Bundle Analysis** with Vite analyzer
- **Caching** for API responses

### 🚀 Backend Optimizations

- **Database Indexing** on frequently queried fields
- **Pagination** for large datasets (20 items per page)
- **Connection Pooling** with Mongoose
- **Response Compression** with express compression
- **Query Optimization** with select and populate

### 📊 Monitoring & Analytics

- **Error Tracking** with try-catch blocks
- **Performance Monitoring** with response times
- **Usage Analytics** with request logging
- **Health Checks** for API endpoints

---

## 🤝 Contributing

We welcome contributions to Spendiq! Here's how you can help:

### 🔧 Development Setup

1. **Fork** the repository on GitHub

   ```bash
   # Visit: https://github.com/4xush/Spendiq.git
   # Click "Fork" button
   ```

2. **Clone** your fork

   ```bash
   git clone https://github.com/YOUR_USERNAME/Spendiq.git
   cd Spendiq
   ```

3. **Create** a feature branch

   ```bash
   git checkout -b feature/awesome-new-feature
   ```

4. **Make** your changes
5. **Test** your changes thoroughly
6. **Commit** with descriptive messages

   ```bash
   git commit -m "Add awesome new feature: detailed description"
   ```

7. **Push** to your fork

   ```bash
   git push origin feature/awesome-new-feature
   ```

8. **Create** a Pull Request

### 📝 Contribution Guidelines

- **Code Style**: Follow existing code style and formatting
- **Testing**: Add tests for new features
- **Documentation**: Update README and code comments
- **Commits**: Use clear, descriptive commit messages
- **Issues**: Reference issue numbers in PRs

### 🐛 Bug Reports

When reporting bugs, please include:

- Operating system and version
- Node.js and npm versions
- Browser and version (for frontend issues)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error logs

### 💡 Feature Requests

We love new ideas! Please provide:

- Clear description of the feature
- Use case and benefits
- Any implementation suggestions
- Mockups or examples (if applicable)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Spendiq Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🆘 Troubleshooting

### 🔧 Common Issues & Solutions

#### MongoDB Connection Error

```bash
# Error: MongooseError: The `uri` parameter to `openUri()` must be a string
```

**Solution:**

- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For Atlas: Verify network access and credentials

#### Gemini API Errors

```bash
# Error: API key not valid
```

**Solution:**

- Verify API key in `.env` file
- Check [Google AI Studio](https://makersuite.google.com/app/apikey) for key status
- Ensure API quota isn't exceeded

#### File Upload Issues

```bash
# Error: File too large or unsupported format
```

**Solution:**

- Check file size (max 5MB)
- Verify file format (JPG, PNG, PDF only)
- Ensure `uploads` directory exists and has write permissions

#### Build Errors

```bash
# Error: Cannot resolve module
```

**Solution:**

- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Check Node.js version (v16+)

#### CORS Errors

```bash
# Error: Access-Control-Allow-Origin
```

**Solution:**

- Verify `FRONTEND_URL` in backend `.env`
- Check if both servers are running
- Ensure correct API URLs in frontend

### 🔍 Debug Mode

Enable detailed logging:

**Backend:**

```env
LOG_LEVEL=debug
NODE_ENV=development
```

**Frontend:**

```bash
# Open browser dev tools (F12)
# Check Console and Network tabs
```

### 📞 Getting Help

1. **Check** existing [GitHub Issues](https://github.com/4xush/Spendiq.git/issues)
2. **Search** through documentation
3. **Create** new issue with detailed information
4. **Join** our community discussions

---

## 🌟 Acknowledgments

### 🙏 Special Thanks

- **Google Gemini AI** - For powerful AI processing capabilities
- **MongoDB** - For flexible document storage
- **React Team** - For the amazing frontend framework
- **Tailwind CSS** - For beautiful, utility-first styling
- **Vite** - For lightning-fast development experience

### 🏆 Contributors

<div align="center">

[![Contributors](https://contrib.rocks/image?repo=Sumitsagariiitg/Spendiq)](https://github.com/4xush/Spendiq.git/graphs/contributors)

</div>

### 📚 Inspiration

Built with inspiration from modern fintech applications and the need for intelligent personal finance management tools.

---

<div align="center">

### 🚀 **Built with ❤️ for Financial Freedom**

**[⬆ Back to Top](#-spendiq---ai-powered-personal-finance-manager)**

---

![Built with Love](https://img.shields.io/badge/Built%20with-❤️-red?style=for-the-badge)
![Made in India](https://img.shields.io/badge/Made%20in-🇮🇳%20India-orange?style=for-the-badge)

**Star ⭐ this repository if you found it helpful!**

</div>

