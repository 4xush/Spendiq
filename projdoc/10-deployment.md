# 🚀 Deployment Guide

## 🌐 Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Frontend"
            CDN[CDN/Static Files]
            FE1[Frontend Instance 1]
            FE2[Frontend Instance 2]
        end
        
        subgraph "Backend Services"
            API1[API Server 1]
            API2[API Server 2]
            API3[API Server 3]
        end
        
        subgraph "Databases"
            PRIMARY[(Primary MongoDB)]
            REPLICA1[(Replica 1)]
            REPLICA2[(Replica 2)]
            REDIS[(Redis Cache)]
        end
        
        subgraph "External Services"
            GEMINI[Google Gemini AI]
            STORAGE[File Storage]
        end
    end
    
    LB --> CDN
    LB --> FE1
    LB --> FE2
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> PRIMARY
    API2 --> PRIMARY
    API3 --> PRIMARY
    
    PRIMARY --> REPLICA1
    PRIMARY --> REPLICA2
    
    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS
    
    API1 --> GEMINI
    API2 --> GEMINI
    API3 --> GEMINI
    
    API1 --> STORAGE
    API2 --> STORAGE
    API3 --> STORAGE
```

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# Application Configuration
NODE_ENV=production
PORT=5000
APP_NAME=Personal Finance Assistant
APP_VERSION=1.0.0

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production_db
MONGODB_OPTIONS=retryWrites=true&w=majority&ssl=true

# Redis Configuration
REDIS_HOST=redis-cluster.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TLS=true

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_256_bit_key_here
JWT_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_RATE_LIMIT=true

# AI Services
GEMINI_API_KEY=your_production_gemini_api_key
OCR_LANGUAGE=eng
OCR_MAX_WORKERS=5

# File Storage
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# External URLs
FRONTEND_URL=https://finance.yourdomain.com
BACKEND_URL=https://api.finance.yourdomain.com
ALLOWED_ORIGINS=https://finance.yourdomain.com,https://app.yourdomain.com

# Monitoring & Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
SENTRY_DSN=your_sentry_dsn_here

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🐳 Docker Configuration

### Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies and source
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/uploads ./uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
```

### Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Copy build files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:6.0
    container_name: finance_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: finance_app
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - finance_network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: finance_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass redis123
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - finance_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finance_backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/finance_app?authSource=admin
      REDIS_HOST: redis
      REDIS_PASSWORD: redis123
      JWT_SECRET: dev_jwt_secret_key_here
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "5000:5000"
    volumes:
      - ./backend/uploads:/app/uploads
    depends_on:
      - mongodb
      - redis
    networks:
      - finance_network

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: finance_frontend
    restart: unless-stopped
    environment:
      VITE_BACKEND_URL: http://localhost:5000/api
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - finance_network

volumes:
  mongodb_data:
  redis_data:

networks:
  finance_network:
    driver: bridge
```

## ☁️ Cloud Deployment (AWS)

### AWS Infrastructure Setup
```yaml
# infrastructure/cloudformation.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Personal Finance App Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-finance-vpc'

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.3.0/24

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.4.0/24

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-finance-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${Environment}-finance-cluster'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT

  # RDS Instance
  DBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-finance-db'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: financeuser
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup

  # ElastiCache Redis
  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup
      CacheSubnetGroupName: !Ref RedisSubnetGroup
```

### ECS Task Definitions
```json
{
  "family": "finance-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "finance-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/finance-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:finance/mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:finance/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/finance-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```
## 🚀 Deployment Scripts

### Automated Deployment Pipeline
```bash
#!/bin/bash
# deploy.sh

set -e

ENVIRONMENT=${1:-staging}
REGION=${2:-us-east-1}
ECR_REGISTRY="your-account.dkr.ecr.$REGION.amazonaws.com"

echo "🚀 Starting deployment to $ENVIRONMENT"

# Build and push backend image
echo "📦 Building backend image..."
cd backend
docker build -t finance-backend:latest .
docker tag finance-backend:latest $ECR_REGISTRY/finance-backend:latest
docker push $ECR_REGISTRY/finance-backend:latest
cd ..

# Build and push frontend image
echo "📦 Building frontend image..."
cd frontend
docker build -t finance-frontend:latest .
docker tag finance-frontend:latest $ECR_REGISTRY/finance-frontend:latest
docker push $ECR_REGISTRY/finance-frontend:latest
cd ..

# Update ECS services
echo "🔄 Updating ECS services..."
aws ecs update-service \
    --cluster "$ENVIRONMENT-finance-cluster" \
    --service "$ENVIRONMENT-finance-backend" \
    --force-new-deployment \
    --region $REGION

aws ecs update-service \
    --cluster "$ENVIRONMENT-finance-cluster" \
    --service "$ENVIRONMENT-finance-frontend" \
    --force-new-deployment \
    --region $REGION

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster "$ENVIRONMENT-finance-cluster" \
    --services "$ENVIRONMENT-finance-backend" "$ENVIRONMENT-finance-frontend" \
    --region $REGION

echo "✅ Deployment completed successfully!"
```

### Database Migration Script
```javascript
// scripts/migrate.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const migrations = [
    {
        version: '1.0.0',
        description: 'Add indexes for performance',
        up: async () => {
            const db = mongoose.connection.db;
            
            // Add compound indexes
            await db.collection('transactions').createIndex(
                { userId: 1, date: -1 },
                { background: true }
            );
            
            await db.collection('transactions').createIndex(
                { userId: 1, type: 1, date: -1 },
                { background: true }
            );
            
            console.log('✅ Indexes created successfully');
        }
    },
    {
        version: '1.1.0',
        description: 'Add text search indexes',
        up: async () => {
            const db = mongoose.connection.db;
            
            await db.collection('transactions').createIndex({
                description: 'text',
                category: 'text',
                'metadata.merchant': 'text'
            }, { background: true });
            
            console.log('✅ Text search indexes created');
        }
    }
];

async function runMigrations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');
        
        for (const migration of migrations) {
            console.log(`🔄 Running migration: ${migration.description}`);
            await migration.up();
        }
        
        console.log('✅ All migrations completed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    runMigrations();
}
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
```javascript
// backend/src/routes/health.js
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'redis';

const router = express.Router();

// Basic health check
router.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0'
    };
    
    res.json(health);
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
    const checks = {};
    
    // Database check
    try {
        await mongoose.connection.db.admin().ping();
        checks.database = { status: 'healthy', responseTime: 0 };
    } catch (error) {
        checks.database = { status: 'unhealthy', error: error.message };
    }
    
    // Redis check
    try {
        const redis = Redis.createClient(process.env.REDIS_HOST);
        await redis.ping();
        checks.redis = { status: 'healthy' };
        await redis.quit();
    } catch (error) {
        checks.redis = { status: 'unhealthy', error: error.message };
    }
    
    // Memory check
    const memUsage = process.memoryUsage();
    checks.memory = {
        status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    };
    
    const overallStatus = Object.values(checks).every(check => 
        check.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';
    
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString()
    });
});

export default router;
```

### Prometheus Metrics
```javascript
// monitoring/metrics.js
import promClient from 'prom-client';

// Create metrics registry
const register = new promClient.Registry();

// Default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const databaseQueryDuration = new promClient.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'collection'],
    registers: [register]
});

const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [register]
});

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration
            .labels(req.method, req.route?.path || req.path, res.statusCode)
            .observe(duration);
    });
    
    next();
};

// Metrics endpoint
export const metricsHandler = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};
```

## 🔒 Security Hardening

### SSL/TLS Configuration
```nginx
# nginx/nginx.conf
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    listen 80;
    server_name finance.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name finance.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/finance.crt;
    ssl_certificate_key /etc/ssl/private/finance.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

## 📈 Scaling Strategy

### Horizontal Scaling Configuration
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: finance-backend
  template:
    metadata:
      labels:
        app: finance-backend
    spec:
      containers:
      - name: backend
        image: finance-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: production
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: finance-backend-service
spec:
  selector:
    app: finance-backend
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: finance-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: finance-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        env:
          MONGO_INITDB_ROOT_USERNAME: test
          MONGO_INITDB_ROOT_PASSWORD: test
        options: >-
          --health-cmd mongosh --health-interval 10s --health-timeout 5s --health-retries 5
        ports:
          - 27017:27017
          
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          backend/package-lock.json
          frontend/package-lock.json
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        npm test
      env:
        MONGODB_URI: mongodb://test:test@localhost:27017/test?authSource=admin
        REDIS_HOST: localhost
        JWT_SECRET: test_secret
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: finance-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: finance-frontend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd frontend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster production-finance-cluster \
          --service production-finance-backend \
          --force-new-deployment
        
        aws ecs update-service \
          --cluster production-finance-cluster \
          --service production-finance-frontend \
          --force-new-deployment
```

## 📋 Deployment Checklist

### Pre-deployment Checklist
- ✅ **Environment Variables**: All production secrets configured
- ✅ **Database Setup**: Production database provisioned and secured
- ✅ **SSL Certificates**: Valid SSL certificates installed
- ✅ **Domain Configuration**: DNS records pointing to load balancer
- ✅ **Monitoring Setup**: Health checks and monitoring configured
- ✅ **Backup Strategy**: Database backup automation in place
- ✅ **Security Review**: Security hardening implemented
- ✅ **Performance Testing**: Load testing completed
- ✅ **Documentation**: Deployment documentation updated

### Post-deployment Checklist
- ✅ **Health Checks**: All health endpoints responding
- ✅ **Database Connectivity**: Database connections working
- ✅ **External Services**: AI services (Gemini) working
- ✅ **File Uploads**: File processing pipeline functional
- ✅ **Authentication**: User login/registration working
- ✅ **API Endpoints**: All API endpoints responding correctly
- ✅ **Frontend**: Website loading and functional
- ✅ **Performance**: Response times within acceptable limits
- ✅ **Monitoring**: Alerts and monitoring active
- ✅ **Logs**: Application logs being collected

---

*This deployment guide ensures a robust, scalable, and secure production deployment of the Personal Finance Assistant application.*
