# 🏗️ System Architecture Overview

## 🎯 High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Frontend]
        Router[React Router]
        State[Context API]
        UI --> Router
        UI --> State
    end
    
    subgraph "API Gateway"
        Express[Express.js Server]
        Auth[JWT Middleware]
        RateLimit[Rate Limiter]
        Express --> Auth
        Express --> RateLimit
    end
    
    subgraph "Business Logic"
        Controllers[Controllers]
        Services[Services]
        Middleware[Middleware]
        Controllers --> Services
        Controllers --> Middleware
    end
    
    subgraph "AI Services"
        OCR[Tesseract OCR]
        Gemini[Google Gemini AI]
        PDF[PDF Parser]
    end
    
    subgraph "Data Layer"
        MongoDB[(MongoDB)]
        FileSystem[File Storage]
    end
    
    UI --> Express
    Controllers --> OCR
    Controllers --> Gemini
    Controllers --> PDF
    Controllers --> MongoDB
    Controllers --> FileSystem
```

## 🔄 Request Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant C as Controller
    participant S as Service
    participant AI as AI Service
    participant DB as Database
    
    U->>F: User Action
    F->>A: HTTP Request
    A->>A: Authentication
    A->>A: Rate Limiting
    A->>C: Route to Controller
    C->>C: Input Validation
    
    alt File Upload
        C->>S: Process File
        S->>AI: OCR/AI Processing
        AI-->>S: Extracted Data
        S-->>C: Processed Result
    else Regular Transaction
        C->>DB: Database Operation
        DB-->>C: Result
    end
    
    C->>F: JSON Response
    F->>U: Updated UI
```

## 📁 Project Structure

```
personal-finance-assistant/
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic & AI services
│   │   ├── utils/            # Helper utilities
│   │   └── server.js         # Application entry point
│   ├── uploads/              # File storage
│   └── package.json
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context providers
│   │   ├── utils/           # Frontend utilities
│   │   └── App.jsx          # Main application component
│   ├── public/              # Static assets
│   └── package.json
│
└── projdoc/                  # Project documentation
```

## 🔧 Component Architecture

### Backend Components

```mermaid
graph TD
    Server[Express Server] --> Routes[Route Handlers]
    Routes --> Controllers[Controllers]
    Controllers --> Services[Services]
    Controllers --> Models[MongoDB Models]
    
    Services --> AI[AI Services]
    Services --> File[File Services]
    Services --> Email[Email Services]
    
    AI --> OCR[OCR Service]
    AI --> Gemini[Gemini AI]
    AI --> PDF[PDF Parser]
    
    Models --> DB[(MongoDB)]
    File --> FS[File System]
```

### Frontend Components

```mermaid
graph TD
    App[App.jsx] --> Router[React Router]
    App --> Auth[Auth Context]
    
    Router --> Pages[Page Components]
    Pages --> Layout[Layout Component]
    
    Layout --> Nav[Navigation]
    Layout --> Content[Main Content]
    
    Content --> Dashboard[Dashboard]
    Content --> Transactions[Transactions]
    Content --> Analytics[Analytics]
    Content --> Upload[Upload]
    Content --> P2P[P2P Dashboard]
    
    Transactions --> TCard[Transaction Card]
    Transactions --> TTable[Transaction Table]
    Transactions --> TFilters[Transaction Filters]
    Transactions --> Modals[Various Modals]
    
    Analytics --> Charts[Chart Components]
    Analytics --> Filters[Analytics Filters]
    
    Upload --> FileZone[File Upload Zone]
    Upload --> Processing[Processing Status]
    Upload --> Results[Upload Results]
```

## 🔒 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        HTTPS[HTTPS/TLS]
        Helmet[Helmet Security]
        CORS[CORS Policy]
        RateLimit[Rate Limiting]
        JWT[JWT Authentication]
        Validation[Input Validation]
        Sanitization[Data Sanitization]
    end
    
    User[User Request] --> HTTPS
    HTTPS --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> JWT
    JWT --> Validation
    Validation --> Sanitization
    Sanitization --> Controller[Controller Logic]
```

## 🗃️ Data Flow Architecture

```mermaid
graph LR
    subgraph "Data Sources"
        Manual[Manual Entry]
        Receipt[Receipt Upload]
        PDF[PDF Upload]
        Import[Bulk Import]
    end
    
    subgraph "Processing Pipeline"
        Upload[File Upload]
        OCR[OCR Processing]
        AI[AI Analysis]
        Parse[Data Parsing]
        Validate[Validation]
    end
    
    subgraph "Storage"
        MongoDB[(MongoDB)]
        Files[File Storage]
    end
    
    subgraph "Output"
        Dashboard[Dashboard]
        Analytics[Analytics]
        Reports[Reports]
        Export[Export]
    end
    
    Manual --> Validate
    Receipt --> Upload
    PDF --> Upload
    Import --> Parse
    
    Upload --> OCR
    OCR --> AI
    AI --> Parse
    Parse --> Validate
    
    Validate --> MongoDB
    Upload --> Files
    
    MongoDB --> Dashboard
    MongoDB --> Analytics
    MongoDB --> Reports
    MongoDB --> Export
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Dev[Development Server]
        Local[Local Database]
    end
    
    subgraph "Staging"
        Stage[Staging Server]
        StageDB[Staging Database]
    end
    
    subgraph "Production"
        LB[Load Balancer]
        App1[App Server 1]
        App2[App Server 2]
        ProdDB[(Production MongoDB)]
        Redis[(Redis Cache)]
        CDN[CDN for Static Files]
    end
    
    Dev --> Stage
    Stage --> LB
    LB --> App1
    LB --> App2
    App1 --> ProdDB
    App2 --> ProdDB
    App1 --> Redis
    App2 --> Redis
    CDN --> LB
```

## 📊 Performance Considerations

### Database Optimization
- **Indexing Strategy**: Compound indexes on userId + date + type
- **Query Optimization**: Pagination and filtering at database level
- **Connection Pooling**: MongoDB connection pooling for scalability

### API Performance
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Response Compression**: Gzip compression for API responses
- **Caching Strategy**: Redis for frequent queries

### Frontend Optimization
- **Code Splitting**: React lazy loading for pages
- **Bundle Optimization**: Vite for optimized builds
- **Image Optimization**: Sharp for image processing

## 🔄 Scalability Design

```mermaid
graph TD
    subgraph "Horizontal Scaling"
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end
    
    subgraph "Database Scaling"
        Primary[(Primary DB)]
        Replica1[(Replica 1)]
        Replica2[(Replica 2)]
    end
    
    subgraph "Caching Layer"
        Redis1[(Redis Primary)]
        Redis2[(Redis Replica)]
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Primary
    API2 --> Primary
    API3 --> Primary
    
    Primary --> Replica1
    Primary --> Replica2
    
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    Redis1 --> Redis2
```

---

*This architecture supports the current feature set and is designed for scalability and maintainability.*