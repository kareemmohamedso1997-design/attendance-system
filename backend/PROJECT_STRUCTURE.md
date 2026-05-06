# Complete Backend Project Structure & Files

## 📁 Project Structure

```
attendance-system/backend/
├── config/
│   └── database.js                 # MySQL connection pool & initialization
├── controllers/
│   ├── HealthController.js         # Health check endpoints
│   └── DatabaseController.js       # Database status & test endpoints
├── middleware/
│   └── errorHandler.js             # Global error handling middleware
├── models/
│   ├── User.js                     # User database CRUD operations
│   └── Attendance.js               # Attendance database operations
├── routes/
│   ├── index.js                    # Main routes aggregator
│   ├── healthRoutes.js             # Health check routes
│   └── databaseRoutes.js           # Database test routes
├── utils/
│   └── logger.js                   # Logging utility with levels
├── .env                            # Environment variables (SECRET)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # NPM dependencies
├── server.js                       # Main entry point
└── README.md                       # Documentation
```

## 📋 Key Files Overview

### 1. **server.js** - Main Server Entry Point
- Initializes Express application
- Sets up all middleware (security, compression, logging)
- Initializes database and creates tables
- Registers all routes
- Handles graceful shutdown

### 2. **config/database.js** - Database Configuration
- Creates and manages MySQL connection pool
- Implements query execution wrapper
- Auto-creates tables on startup
- Provides connection testing
- Handles connection lifecycle

### 3. **controllers/** - Business Logic
- **HealthController.js** - Server health/status check
- **DatabaseController.js** - Database connection testing

### 4. **models/** - Data Access Layer
- **User.js** - Create, read, update, delete operations for users
- **Attendance.js** - Check-in/out recording and statistics

### 5. **routes/** - API Endpoints
- **healthRoutes.js** - GET /health
- **databaseRoutes.js** - GET /db-test, GET /db-status
- **index.js** - Aggregates all routes

### 6. **middleware/** - Request Processing
- **errorHandler.js** - Centralized error handling and 404 responses

### 7. **utils/** - Utilities
- **logger.js** - Structured logging with colors and levels

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

### Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Test Endpoints

```bash
# Server health
curl http://localhost:3000/health

# Database connection test
curl http://localhost:3000/db-test

# Database status & tables
curl http://localhost:3000/db-status
```

## 📊 Database Schema

### Users Table
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
name            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE
```

### Attendance Table
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
user_id         INT NOT NULL (Foreign Key → users.id)
check_in        DATETIME NOT NULL
check_out       DATETIME
date            DATE NOT NULL
duration_hours  DECIMAL(5, 2)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE
```

## 🔌 API Endpoints

### Health Check
```
GET /health
Response: Server status, uptime, memory usage
```

### Database Test
```
GET /db-test
Response: Database connection status with credentials
```

### Database Status
```
GET /db-status
Response: Connected tables with row counts
```

## 📦 NPM Dependencies

```json
{
  "express": "^4.18.2",           // Web framework
  "mysql2": "^3.6.5",             // MySQL client with promises
  "dotenv": "^16.3.1",            // Environment variables
  "cors": "^2.8.5",               // CORS handling
  "helmet": "^7.1.0",             // Security headers
  "compression": "^1.7.4",        // Gzip compression
  "morgan": "^1.10.0"             // HTTP logging
}
```

## 🛡️ Security Features

✅ **Helmet** - Sets secure HTTP headers  
✅ **CORS** - Configurable cross-origin access  
✅ **Compression** - Gzip response compression  
✅ **Error Masking** - Hides sensitive info in production  
✅ **Connection Pooling** - Efficient resource usage  
✅ **Input Validation** - Database level constraints  

## 🔄 Request Flow

```
Client Request
    ↓
[CORS Middleware] → Allow/Deny
    ↓
[Security Middleware] → Helmet headers
    ↓
[Compression] → Gzip if supported
    ↓
[Morgan Logger] → Log request
    ↓
[Route Handler] → Find matching route
    ↓
[Controller] → Business logic
    ↓
[Model] → Database operations
    ↓
[Response] → Send JSON
    ↓
[Error Handler] → Catch errors
    ↓
Client Response
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=bnqiufz1rgr9ignxhmfu-mysql.services.clever-cloud.com
DB_PORT=3306
DB_USER=ubec9o1zox15mtmv
DB_PASSWORD=3MgcavEWvUxySr4QC5hN
DB_NAME=bnqiufz1rgr9ignxhmfu

# Connection Pool
DB_POOL_LIMIT=10
DB_CONNECTION_TIMEOUT=10000

# Logging
LOG_LEVEL=info
```

## 📝 Usage Examples

### Check Server Health
```bash
curl http://localhost:3000/health | jq
```

### Check Database Connection
```bash
curl http://localhost:3000/db-test | jq
```

### Get Database Status
```bash
curl http://localhost:3000/db-status | jq
```

## 🎯 Key Features

- ✅ Production-ready code structure
- ✅ Centralized error handling
- ✅ Structured logging system
- ✅ MySQL connection pooling
- ✅ Auto-table creation
- ✅ Graceful shutdown
- ✅ Security middleware
- ✅ CORS enabled
- ✅ Request compression
- ✅ HTTP logging
- ✅ Clean separation of concerns
- ✅ RESTful API design

## 📚 File Descriptions

### server.js
Main application entry point. Initializes Express, middleware, database, routes, and error handlers.

### config/database.js
Database configuration and connection pool management. Handles all MySQL operations with proper error handling and connection lifecycle.

### controllers/HealthController.js
Handles server health check endpoint with uptime, memory usage, and environment information.

### controllers/DatabaseController.js
Handles database connection testing and status checking with detailed table information.

### models/User.js
User data access layer with create, read, update, delete, and list operations.

### models/Attendance.js
Attendance data access layer with check-in, check-out, statistics, and date range queries.

### routes/index.js
Main routes aggregator that combines all route files.

### routes/healthRoutes.js
Health check endpoint routes.

### routes/databaseRoutes.js
Database test and status endpoint routes.

### middleware/errorHandler.js
Global error handling middleware and custom error class.

### utils/logger.js
Structured logging utility with different log levels and colored output.

## 🚀 Deployment

### Steps to Deploy

1. Push code to Git repository
2. Set up environment variables on hosting platform
3. Install dependencies: `npm install`
4. Start server: `npm start`
5. Verify endpoints are accessible

### Environment Setup

Ensure these variables are set on your hosting platform:
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- NODE_ENV=production
- PORT=3000 (or your hosting port)

## 🧪 Testing

### Test Server Health
```bash
curl -X GET http://localhost:3000/health
```

### Test Database
```bash
curl -X GET http://localhost:3000/db-test
curl -X GET http://localhost:3000/db-status
```

## 📖 Additional Resources

- Express.js: https://expressjs.com/
- MySQL2: https://github.com/sidorares/node-mysql2
- Node.js Best Practices: https://nodejs.org/en/docs/
