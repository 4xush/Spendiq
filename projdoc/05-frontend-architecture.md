# 🎨 Frontend Architecture & Components

## 🏗️ React Application Structure

```mermaid
graph TD
    A[App.jsx] --> B[AuthProvider]
    A --> C[Router]
    A --> D[Toaster]
    
    B --> E[Authentication Context]
    C --> F[Route Protection]
    C --> G[Page Components]
    
    G --> H[Dashboard]
    G --> I[Transactions]
    G --> J[Analytics]
    G --> K[Upload]
    G --> L[P2P Dashboard]
    G --> M[Profile]
    
    F --> N[ProtectedRoute]
    F --> O[Layout]
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style O fill:#e8f5e8
```

## 📁 Component Hierarchy

### Main Application Structure
```
src/
├── App.jsx                    # Root component
├── main.jsx                   # React app entry point
├── index.css                  # Global styles
├── components/                # Reusable components
│   ├── Layout.jsx            # Main layout wrapper
│   ├── LoadingSpinner.jsx    # Loading indicator
│   ├── ProtectedRoute.jsx    # Route protection
│   ├── P2PAnalytics.jsx      # P2P analytics component
│   ├── Analytics/            # Analytics components
│   └── Upload/               # Upload components
├── pages/                    # Page components
│   ├── Dashboard.jsx         # Main dashboard
│   ├── Transactions.jsx      # Transaction management
│   ├── Analytics.jsx         # Analytics page
│   ├── Upload.jsx           # File upload page
│   ├── Login.jsx            # Authentication
│   ├── Register.jsx         # User registration
│   ├── Profile.jsx          # User profile
│   ├── Dashboard/           # Dashboard components
│   ├── Transaction/         # Transaction components
│   └── P2P/                 # P2P components
├── context/                 # React Context providers
│   └── AuthContext.jsx     # Authentication context
└── utils/                   # Utility functions
    └── api.js              # API client
```

## 🔧 Core Components

### App Component Architecture
```mermaid
flowchart TD
    A[App.jsx] --> B[AuthProvider Wrapper]
    B --> C[Router Configuration]
    C --> D[Public Routes]
    C --> E[Protected Routes]
    
    D --> D1[/login]
    D --> D2[/register]
    
    E --> E1[Layout Wrapper]
    E1 --> E2[Navigation]
    E1 --> E3[Main Content]
    
    E3 --> F[Route Components]
    F --> F1[Dashboard]
    F --> F2[Transactions]
    F --> F3[Analytics]
    F --> F4[Upload]
    F --> F5[P2P Dashboard]
    F --> F6[Profile]
```

### Layout Component
```jsx
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
```

## 🔐 Authentication System

### Auth Context Provider
```mermaid
sequenceDiagram
    participant U as User
    participant AC as AuthContext
    participant API as Backend API
    participant LS as LocalStorage
    
    U->>AC: Login Request
    AC->>API: POST /auth/login
    API-->>AC: JWT Token + User Data
    AC->>LS: Store Token
    AC->>AC: Update Auth State
    AC-->>U: Redirect to Dashboard
```

### Auth Context Implementation
```jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 📊 Dashboard Components

### Dashboard Layout
```mermaid
graph TD
    A[Dashboard.jsx] --> B[Summary Cards]
    A --> C[Recent Transactions]
    A --> D[Financial Trends]
    A --> E[P2P Overview]
    
    B --> B1[Total Income]
    B --> B2[Total Expenses]
    B --> B3[Net Balance]
    B --> B4[Monthly Change]
    
    C --> C1[Transaction List]
    C --> C2[Quick Actions]
    
    D --> D1[7-Day Trend Chart]
    D --> D2[Spending Categories]
    
    E --> E1[P2P Summary]
    E --> E2[Recent P2P Transactions]
```

### Dashboard Sub-Components
```jsx
// Dashboard/SpendingAndP2POverview.jsx
const SpendingAndP2POverview = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SpendingByCategory />
      <P2PSummary />
    </div>
  );
};

// Dashboard/RecentTransactions.jsx
const RecentTransactions = ({ transactions, onViewAll }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
      {transactions.map(transaction => (
        <TransactionCard key={transaction._id} transaction={transaction} />
      ))}
    </div>
  );
};
```

## 💰 Transaction Management

### Transaction Components Architecture
```mermaid
graph TD
    A[Transactions.jsx] --> B[Transaction Filters]
    A --> C[View Mode Toggle]
    A --> D[Bulk Operations]
    A --> E[Transaction Display]
    A --> F[Modals]
    
    B --> B1[Date Range]
    B --> B2[Category Filter]
    B --> B3[Search Input]
    B --> B4[Amount Range]
    
    C --> C1[Card View]
    C --> C2[Table View]
    
    D --> D1[Bulk Select Toggle]
    D --> D2[Select All/None]
    D --> D3[Bulk Delete]
    
    E --> E1[TransactionCard]
    E --> E2[TransactionTable]
    
    F --> F1[TransactionForm]
    F --> F2[EditModal]
    F --> F3[DeleteModal]
    F --> F4[BulkDeleteModal]
    F --> F5[DetailsModal]
```

### Transaction State Management
```jsx
const Transactions = () => {
  // Core state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // UI state
  const [viewMode, setViewMode] = useState('card');
  const [showForm, setShowForm] = useState(false);
  
  // Bulk operations state
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Modal state
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [detailsTransaction, setDetailsTransaction] = useState(null);
};
```

### Transaction Card Component
```jsx
const TransactionCard = ({
  transaction,
  isSelected = false,
  onToggleSelect,
  bulkSelectMode = false,
  onViewDetails,
  onEdit,
  onDelete
}) => {
  const handleCardClick = (e) => {
    if (bulkSelectMode) {
      e.preventDefault();
      onToggleSelect && onToggleSelect(transaction);
    } else {
      onViewDetails && onViewDetails(transaction);
    }
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
        bulkSelectMode 
          ? isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
          : 'border-gray-200 hover:bg-gray-50'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection checkbox for bulk mode */}
      {bulkSelectMode && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(transaction)}
            className="mr-2"
          />
        </div>
      )}
      
      {/* Transaction content */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-gray-900">
            {transaction.description || "No description"}
          </p>
          <p className="text-sm text-gray-500">{transaction.category}</p>
        </div>
        <span className={`badge ${transaction.type === 'income' ? 'badge-green' : 'badge-red'}`}>
          {transaction.type}
        </span>
      </div>
      
      {/* Actions */}
      {!bulkSelectMode && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {formatDate(transaction.date)}
          </span>
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </span>
            <button onClick={() => onEdit(transaction)}>Edit</button>
            <button onClick={() => onDelete(transaction)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 📈 Analytics Components

### Analytics Page Structure
```mermaid
graph TD
    A[Analytics.jsx] --> B[Analytics Filters]
    A --> C[Summary Section]
    A --> D[Charts Section]
    A --> E[Export Options]
    
    B --> B1[Date Range Picker]
    B --> B2[Category Multi-select]
    B --> B3[Amount Range Slider]
    
    C --> C1[SummaryCards]
    C2[Income/Expense/Net]
    
    D --> D1[Category Chart]
    D --> D2[Trend Chart]
    D --> D3[Top Categories]
    D --> D4[Category Table]
    
    E --> E1[CSV Export]
    E --> E2[PDF Report]
    E --> E3[Excel Download]
```

### Chart Components
```jsx
// Analytics/CategoryChart.jsx
const CategoryChart = ({ data, type = 'pie' }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Analytics/TrendChart.jsx
const TrendChart = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Spending Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## 📤 Upload Components

### Upload Flow Architecture
```mermaid
sequenceDiagram
    participant U as User
    participant FZ as FileUploadZone
    participant PS as ProcessingStatus
    participant API as Backend API
    participant UR as UploadResults
    
    U->>FZ: Drop/Select File
    FZ->>API: Upload File
    API-->>FZ: Upload Response
    FZ->>PS: Show Processing
    PS->>API: Poll Status
    API-->>PS: Processing Update
    PS->>UR: Show Results
    UR->>U: Confirm Transaction
```

### Upload Components
```jsx
// Upload/FileUploadZone.jsx
const FileUploadZone = ({ onFileUpload, uploading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
    >
      {uploading ? (
        <div className="flex flex-col items-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Uploading...</p>
        </div>
      ) : (
        <>
          <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-lg text-gray-600">
            Drop your receipt here or{' '}
            <button className="text-blue-600 hover:text-blue-700">
              browse files
            </button>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Support: PDF, JPG, PNG (Max 10MB)
          </p>
        </>
      )}
    </div>
  );
};
```

## 🤝 P2P Components

### P2P Dashboard Layout
```mermaid
graph TD
    A[P2PDashboard.jsx] --> B[P2P Summary Cards]
    A --> C[P2P Filters]
    A --> D[P2P Transaction List]
    A --> E[Quick Actions]
    
    B --> B1[Total Lent]
    B --> B2[Total Borrowed]
    B --> B3[Net P2P Amount]
    B --> B4[Pending Transactions]
    
    C --> C1[Status Filter]
    C --> C2[Type Filter]
    C --> C3[Person Search]
    
    D --> D1[P2P Transaction Cards]
    D --> D2[Status Indicators]
    D --> D3[Action Buttons]
    
    E --> E1[New P2P Transaction]
    E --> E2[Mark as Completed]
    E --> E3[Send Reminder]
```

## 🎨 Styling & UI Framework

### Tailwind CSS Implementation
```mermaid
graph LR
    A[Tailwind CSS] --> B[Utility Classes]
    A --> C[Component Classes]
    A --> D[Custom Styles]
    
    B --> B1[Layout Classes]
    B --> B2[Color Classes]
    B --> B3[Typography Classes]
    B --> B4[Spacing Classes]
    
    C --> C1[Button Components]
    C --> C2[Card Components]
    C --> C3[Form Components]
    
    D --> D1[Custom Animations]
    D --> D2[Brand Colors]
    D --> D3[Component Variants]
```

### Responsive Design Breakpoints
```css
/* Tailwind CSS Breakpoints */
sm: 640px    /* Small devices */
md: 768px    /* Medium devices */
lg: 1024px   /* Large devices */
xl: 1280px   /* Extra large devices */
2xl: 1536px  /* 2X large devices */
```

### Common CSS Classes
```css
/* Button Styles */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors;
}

/* Card Styles */
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

/* Form Styles */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}
```

## 🔄 State Management

### React Context Usage
```mermaid
graph TD
    A[App Level] --> B[AuthContext]
    A --> C[Component State]
    A --> D[Local Storage]
    
    B --> B1[User Data]
    B --> B2[Token Management]
    B --> B3[Auth Methods]
    
    C --> C1[Page State]
    C --> C2[Form State]
    C --> C3[UI State]
    
    D --> D1[Token Persistence]
    D --> D2[User Preferences]
```

### State Management Pattern
- ✅ **React Context** for global authentication state
- ✅ **useState** for component-level state
- ✅ **useEffect** for side effects and data fetching
- ✅ **Custom hooks** for reusable logic
- ✅ **Local Storage** for persistence

## 🚀 Performance Optimizations

### Code Splitting & Lazy Loading
```jsx
// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Route implementation with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/transactions" element={<Transactions />} />
    <Route path="/analytics" element={<Analytics />} />
  </Routes>
</Suspense>
```

### Optimization Techniques
- ✅ **React.memo** for preventing unnecessary re-renders
- ✅ **useMemo** for expensive calculations
- ✅ **useCallback** for stable function references
- ✅ **Virtual scrolling** for large transaction lists
- ✅ **Image optimization** with lazy loading
- ✅ **Bundle splitting** with Vite

---

*This frontend architecture provides a scalable, maintainable, and performant React application with modern development practices.*