# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd attendance-system/backend
npm install
```

## Step 2: Environment Setup

Your `.env` file is already configured with the database credentials. Verify it contains:

```
DB_HOST=bnqiufz1rgr9ignxhmfu-mysql.services.clever-cloud.com
DB_PORT=3306
DB_USER=ubec9o1zox15mtmv
DB_PASSWORD=3MgcavEWvUxySr4QC5hN
DB_NAME=bnqiufz1rgr9ignxhmfu
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## Step 3: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Step 4: Test the Endpoints

### Test 1: Server Health
```bash
curl http://localhost:3000/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "environment": "development",
  "memory": {
    "heapUsed": "45 MB",
    "heapTotal": "128 MB"
  }
}
```

### Test 2: Database Connection
```bash
curl http://localhost:3000/db-test
```

Expected Response:
```json
{
  "success": true,
  "message": "Database connection successful",
  "database": {
    "host": "bnqiufz1rgr9ignxhmfu-mysql.services.clever-cloud.com",
    "port": "3306",
    "database": "bnqiufz1rgr9ignxhmfu",
    "user": "ubec9o1zox15mtmv"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test 3: Database Status
```bash
curl http://localhost:3000/db-status
```

Expected Response:
```json
{
  "success": true,
  "status": "connected",
  "database": {
    "host": "bnqiufz1rgr9ignxhmfu-mysql.services.clever-cloud.com",
    "port": "3306",
    "name": "bnqiufz1rgr9ignxhmfu"
  },
  "tables": [
    {
      "TABLE_NAME": "users",
      "TABLE_ROWS": 0
    },
    {
      "TABLE_NAME": "attendance",
      "TABLE_ROWS": 0
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Project Features ✅

- ✅ Express.js server on port 3000
- ✅ MySQL connection pooling
- ✅ Automatic table creation
- ✅ RESTful API endpoints
- ✅ Health check endpoint
- ✅ Database test endpoint
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ Security middleware (Helmet)
- ✅ CORS enabled
- ✅ Response compression
- ✅ Request logging (Morgan)
- ✅ Production-ready code
- ✅ Clean project structure
- ✅ Environment configuration

## Project Files Created

```
backend/
├── config/
│   └── database.js              # MySQL connection pool
├── controllers/
│   ├── HealthController.js      # Health check logic
│   └── DatabaseController.js    # Database test logic
├── middleware/
│   └── errorHandler.js          # Error handling
├── models/
│   ├── User.js                  # User CRUD operations
│   └── Attendance.js            # Attendance operations
├── routes/
│   ├── index.js                 # Routes aggregator
│   ├── healthRoutes.js          # Health routes
│   └── databaseRoutes.js        # Database routes
├── utils/
│   └── logger.js                # Logging utility
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore
├── package.json                 # Dependencies
├── server.js                    # Entry point
├── README.md                    # Full documentation
└── PROJECT_STRUCTURE.md         # Detailed structure
```

## Database Schema

### Tables Automatically Created

**users table**
- id (INT, Primary Key, Auto Increment)
- name (VARCHAR 255)
- email (VARCHAR 255, Unique)
- password (VARCHAR 255)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**attendance table**
- id (INT, Primary Key, Auto Increment)
- user_id (INT, Foreign Key → users.id)
- check_in (DATETIME)
- check_out (DATETIME)
- date (DATE)
- duration_hours (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Commands Reference

```bash
# Install dependencies
npm install

# Start development server (auto-reload)
npm run dev

# Start production server
npm start

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/db-test
curl http://localhost:3000/db-status
```

## Server Output on Startup

```
╔════════════════════════════════════════════════╗
║   🚀 Attendance Backend Server Started         ║
╠════════════════════════════════════════════════╣
║   URL: http://localhost:3000                   ║
║   Environment: development                     ║
║   Database: Connected ✓                        ║
║   Tables: Initialized ✓                        ║
╠════════════════════════════════════════════════╣
║   GET  /health       - Health check           ║
║   GET  /db-test      - Database test          ║
║   GET  /db-status    - Database status        ║
╚════════════════════════════════════════════════╝
```

## Troubleshooting

### Database Connection Failed?
1. Check `.env` file has correct credentials
2. Verify network can reach the MySQL host
3. Check that the port (3306) is accessible
4. Verify database name, user, and password

### Port Already in Use?
Change PORT in `.env` file:
```
PORT=3001
```

### Tables Not Created?
Run the server once to auto-create tables. Check the logs for any SQL errors.

## Next Steps

1. ✅ Backend is running
2. ✅ Database is connected
3. ✅ Tables are created
4. Create user authentication endpoints
5. Create CRUD endpoints for users
6. Create attendance check-in/out endpoints
7. Create reporting endpoints

## Support

All code is production-ready and follows best practices:
- Error handling
- Logging
- Security
- Performance optimization
- Clean architecture
- Documentation
