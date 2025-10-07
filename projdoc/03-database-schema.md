# 🗄️ Database Schema & Data Models

## 📊 Database Overview

```mermaid
erDiagram
    User ||--o{ Transaction : creates
    User ||--o{ Receipt : uploads
    Transaction ||--o| Receipt : references
    Category ||--o{ Transaction : categorizes
    
    User {
        ObjectId _id PK
        string name
        string email UK
        string password
        object preferences
        datetime createdAt
        datetime updatedAt
    }
    
    Transaction {
        ObjectId _id PK
        ObjectId userId FK
        string type
        number amount
        string category
        string description
        date date
        string source
        string receiptUrl
        array tags
        object personToPerson
        object metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Receipt {
        ObjectId _id PK
        ObjectId userId FK
        string filename
        string originalName
        string mimetype
        number size
        string path
        string status
        object ocrResult
        object aiAnalysis
        datetime createdAt
        datetime updatedAt
    }
    
    Category {
        ObjectId _id PK
        string name UK
        string type
        string icon
        string color
        boolean isDefault
        datetime createdAt
        datetime updatedAt
    }
```

## 👤 User Model

### Schema Definition
```javascript
const userSchema = {
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    preferences: {
        currency: { type: String, default: 'INR' },
        timezone: { type: String, default: 'UTC' }
    }
}
```

### Indexes
```mermaid
graph LR
    A[User Indexes] --> B[email: unique]
    A --> C[_id: primary]
```

### Security Features
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Email validation with regex
- ✅ Unique email constraint
- ✅ Password exclusion in JSON responses

## 💰 Transaction Model

### Schema Definition
```javascript
const transactionSchema = {
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    source: {
        type: String,
        enum: ['manual', 'receipt', 'pdf', 'image'],
        default: 'manual'
    },
    receiptUrl: String,
    tags: [String],
    
    // P2P Transaction fields
    personToPerson: {
        type: {
            type: String,
            enum: ['lent', 'borrowed', 'gift_given', 'gift_received', 'payment', 'reimbursement']
        },
        personName: String,
        personContact: String,
        dueDate: Date,
        status: {
            type: String,
            enum: ['pending', 'completed', 'overdue', 'cancelled'],
            default: 'pending'
        },
        linkedTransactionId: { type: ObjectId, ref: 'Transaction' },
        notes: String
    },
    
    // AI and OCR metadata
    metadata: {
        confidence: Number,
        originalText: String,
        merchant: String,
        location: String,
        items: [{
            name: String,
            quantity: Number,
            price: Number
        }],
        receiptId: { type: ObjectId, ref: 'Receipt' }
    }
}
```

### Indexes Strategy
```mermaid
graph TD
    A[Transaction Indexes] --> B[Compound Indexes]
    A --> C[Single Field Indexes]
    
    B --> B1["userId + date (desc)"]
    B --> B2["userId + type + date (desc)"]
    B --> B3["userId + category + date (desc)"]
    
    C --> C1[userId: 1]
    C --> C2[date: 1]
    C --> C3[_id: primary]
```

### Virtual Fields
```javascript
// Virtual for formatted amount (positive/negative)
transactionSchema.virtual('formattedAmount').get(function() {
    return this.type === 'expense' ? -this.amount : this.amount;
});
```

### Static Methods
```javascript
// Pagination method
transactionSchema.statics.getPaginated = function(userId, options) {
    // Implements pagination with filters
    // Returns paginated results with proper sorting
};
```

## 📄 Receipt Model

### Schema Definition
```javascript
const receiptSchema = {
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded'
    },
    ocrResult: {
        text: String,
        confidence: Number,
        blocks: Array,
        processedAt: Date
    },
    aiAnalysis: {
        extractedData: {
            amount: Number,
            merchant: String,
            date: Date,
            category: String,
            items: Array
        },
        confidence: Number,
        processedAt: Date
    },
    error: {
        message: String,
        code: String,
        occurredAt: Date
    }
}
```

### File Processing States
```mermaid
stateDiagram-v2
    [*] --> uploaded
    uploaded --> processing: Start OCR
    processing --> completed: Success
    processing --> failed: Error
    failed --> processing: Retry
    completed --> [*]
```

## 🏷️ Category Model

### Schema Definition
```javascript
const categorySchema = {
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'both'],
        default: 'both'
    },
    icon: {
        type: String,
        default: 'folder'
    },
    color: {
        type: String,
        default: '#6B7280'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    description: String
}
```

### Default Categories
```mermaid
graph TD
    A[Categories] --> B[Income Categories]
    A --> C[Expense Categories]
    
    B --> B1[Salary]
    B --> B2[Business Income]
    B --> B3[Investment Returns]
    B --> B4[Freelancing]
    B --> B5[Other Income]
    
    C --> C1[Food & Dining]
    C --> C2[Transportation]
    C --> C3[Shopping]
    C --> C4[Entertainment]
    C --> C5[Bills & Utilities]
    C --> C6[Healthcare]
    C --> C7[Education]
    C --> C8[Travel]
    C --> C9[Personal Care]
    C --> C10[Groceries]
```

## 🔗 Relationships & References

### Data Relationships
```mermaid
graph TD
    A[User] --> B[Transactions]
    A --> C[Receipts]
    B --> D[Categories]
    B --> E[Receipt References]
    B --> F[P2P Links]
    
    B --> G[Self Reference]
    G --> H[Linked Transactions]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

### Foreign Key Constraints
- `Transaction.userId` → `User._id`
- `Transaction.metadata.receiptId` → `Receipt._id`
- `Transaction.personToPerson.linkedTransactionId` → `Transaction._id`
- `Receipt.userId` → `User._id`

## 📈 Data Access Patterns

### Common Query Patterns
```mermaid
flowchart TD
    A[Query Patterns] --> B[User Transactions]
    A --> C[Date Range Queries]
    A --> D[Category Analysis]
    A --> E[P2P Tracking]
    A --> F[Analytics Aggregation]
    
    B --> B1["find({userId, date: {$gte, $lte}})"]
    C --> C1["sort({date: -1}).limit(20)"]
    D --> D1["aggregate([{$group: {_id: '$category'}}])"]
    E --> E1["find({'personToPerson.type': {$exists: true}})"]
    F --> F1["aggregate pipeline for summaries"]
```

### Aggregation Pipelines

#### Monthly Summary
```javascript
[
    { $match: { userId: ObjectId, date: { $gte: startDate, $lte: endDate } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        transactionCount: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
]
```

#### Category Breakdown
```javascript
[
    { $match: { userId: ObjectId, type: "expense" } },
    { $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
        transactionCount: { $sum: 1 },
        avgAmount: { $avg: "$amount" }
    }},
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
]
```

## 🎯 Performance Optimization

### Index Strategy
```mermaid
graph TD
    A[Index Strategy] --> B[Compound Indexes]
    A --> C[Single Field Indexes]
    A --> D[Text Indexes]
    
    B --> B1[Query Performance]
    B --> B2[Sort Optimization]
    B --> B3[Filter Efficiency]
    
    C --> C1[Primary Keys]
    C --> C2[Foreign Keys]
    C --> C3[Unique Constraints]
    
    D --> D1[Search Functionality]
    D --> D2[Full Text Search]
```

### Query Optimization
- ✅ Proper index usage for common queries
- ✅ Pagination to limit result sets
- ✅ Aggregation pipelines for complex analytics
- ✅ Field projection to reduce data transfer
- ✅ Connection pooling for database connections

## 🔒 Data Security & Validation

### Input Validation
```mermaid
graph LR
    A[Input Validation] --> B[Schema Validation]
    A --> C[Express Validator]
    A --> D[Mongoose Validation]
    A --> E[Custom Validators]
    
    B --> B1[Type Checking]
    B --> B2[Required Fields]
    B --> B3[Length Limits]
    
    C --> C1[Request Validation]
    C --> C2[Sanitization]
    C --> C3[Error Handling]
```

### Security Measures
- ✅ Input sanitization for all user data
- ✅ Password hashing with bcrypt
- ✅ ObjectId validation for references
- ✅ File type validation for uploads
- ✅ Size limits for file uploads
- ✅ XSS protection through validation

## 📊 Data Migration & Seeding

### Database Seeding
```javascript
// Default categories seeding
const defaultCategories = [
    { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#ef4444' },
    { name: 'Transportation', type: 'expense', icon: 'car', color: '#3b82f6' },
    { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10b981' }
    // ... more categories
];
```

### Migration Strategy
- ✅ Version-controlled schema changes
- ✅ Data transformation scripts
- ✅ Rollback procedures
- ✅ Index creation/modification
- ✅ Data integrity checks

---

*This database schema is designed for scalability, performance, and data integrity while supporting all application features.*