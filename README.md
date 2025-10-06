# Personal Finance Assistant

A comprehensive MERN stack application for personal finance management with AI-powered features, receipt processing, and analytics dashboard.

## 🚀 Features

### Core Functionality

- ✅ **Income/Expense Tracking**: Create, read, update, and delete financial transactions
- ✅ **Multi-user Support**: Secure user authentication and individual data isolation
- ✅ **Transaction Categorization**: Organize transactions with default and custom categories
- ✅ **Pagination**: Efficient handling of large transaction lists
- ✅ **Date Range Filtering**: Filter transactions by time periods
- ✅ **Search Functionality**: Search transactions by description, category, or merchant

### AI-Powered Features

- ✅ **Receipt OCR**: Extract transaction data from receipt images using Tesseract.js
- ✅ **PDF Statement Processing**: Parse bank statements and import transactions
- ✅ **Smart Categorization**: AI-powered transaction categorization using Gemini API
- ✅ **Financial Insights**: Generate personalized financial recommendations
- ✅ **Merchant Recognition**: Identify merchants from receipt text

### Analytics & Visualization

- ✅ **Interactive Charts**: Recharts-powered visualizations
- ✅ **Expense by Category**: Pie charts and breakdowns
- ✅ **Spending Trends**: Line charts showing income/expense patterns
- ✅ **Financial Summary**: Key metrics and totals
- ✅ **Top Categories**: Most spending categories analysis

### User Experience

- ✅ **Responsive Design**: Mobile-first design with Tailwind CSS
- ✅ **Real-time Feedback**: Toast notifications and loading states
- ✅ **File Upload**: Drag & drop interface for receipts and PDFs
- ✅ **Dark Mode Ready**: Designed with modern UI principles
- ✅ **Accessibility**: WCAG compliant components

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library
- **Tesseract.js** - Client-side OCR

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Express Validator** - Input validation
- **Express Rate Limit** - Rate limiting
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

### AI & Processing

- **Gemini API** - Google's generative AI
- **Tesseract.js** - OCR processing
- **pdf-parse** - PDF text extraction

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server
- **Jest** - Testing framework

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**
- **Gemini API Key** (for AI features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd personal-finance-assistant
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
# Set MONGODB_URI, JWT_SECRET, and GEMINI_API_KEY
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file if needed (API URL)
```

### 4. Database Setup

```bash
# Start MongoDB (if running locally)
mongod

# Optional: Seed default categories
cd backend
npm run seed
```

### 5. Start Development Servers

**Terminal 1 (Backend):**

```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📊 API Documentation

### Authentication Endpoints

```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login user
GET  /api/auth/profile     - Get user profile
PUT  /api/auth/profile     - Update user profile
```

### Transaction Endpoints

```
POST   /api/transactions     - Create transaction
GET    /api/transactions     - List transactions (with pagination)
GET    /api/transactions/:id - Get single transaction
PUT    /api/transactions/:id - Update transaction
DELETE /api/transactions/:id - Delete transaction
```

### Category Endpoints

```
GET    /api/categories       - Get categories
POST   /api/categories       - Create custom category
PUT    /api/categories/:id   - Update custom category
DELETE /api/categories/:id   - Delete custom category
```

### File Processing Endpoints

```
POST /api/files/receipt      - Upload and process receipt
POST /api/files/pdf          - Upload and process PDF statement
GET  /api/files/receipt/:id  - Get receipt processing status
GET  /api/files/receipts     - Get user's receipts
```

### Analytics Endpoints

```
GET /api/analytics/summary        - Financial summary
GET /api/analytics/by-category    - Expenses by category
GET /api/analytics/by-date        - Transactions by date
GET /api/analytics/top-categories - Top spending categories
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/personal_finance
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**

```env
VITE_API_URL=http://localhost:5000/api
```

### Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your backend `.env` file as `GEMINI_API_KEY`

## 📱 Usage Guide

### Adding Transactions

1. Navigate to the Transactions page
2. Click "Add Transaction"
3. Fill in the required details
4. Save the transaction

### Processing Receipts

1. Go to the Upload page
2. Select "Receipt Upload"
3. Upload an image of your receipt
4. The system will automatically extract transaction data
5. Review and confirm the extracted information

### Importing Bank Statements

1. Go to the Upload page
2. Select "PDF Import"
3. Upload your bank statement PDF
4. The system will parse and import transactions
5. Review the imported transactions

### Viewing Analytics

1. Navigate to the Analytics page
2. Select date ranges
3. View spending patterns and trends
4. Get AI-powered insights

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **Security Headers** with Helmet
- **File Upload Validation** with type and size limits

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

### Database Deployment (MongoDB Atlas)

1. Create a cluster on MongoDB Atlas
2. Update `MONGODB_URI` in your environment variables

## 📈 Performance Optimizations

- **Database Indexing** on frequently queried fields
- **Pagination** for large datasets
- **File Size Limits** for uploads
- **Rate Limiting** for API protection
- **Image Optimization** for receipts
- **Lazy Loading** for components
- **Code Splitting** with React Router

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error:**

- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access for MongoDB Atlas

**Gemini API Errors:**

- Verify API key is correct
- Check API quota and billing
- Ensure proper error handling

**File Upload Issues:**

- Check file size limits
- Verify upload directory permissions
- Ensure proper MIME type validation

**Build Errors:**

- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify environment variables

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

Built with ❤️ for the Personal Finance Management Hackathon
