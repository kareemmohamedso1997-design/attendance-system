# Attendance Backend System

Production-ready Node.js + Express backend for Employee Attendance Tracking System with MySQL database connectivity.

## Features

✅ **Express.js Server** - Fast, lightweight web framework  
✅ **MySQL Integration** - Connection pool with proper error handling  
✅ **RESTful API** - Clean JSON endpoints  
✅ **Error Handling** - Centralized error management  
✅ **Logging** - Structured logging with levels  
✅ **Security** - Helmet, CORS, and compression middleware  
✅ **Scalable Architecture** - Clean separation of concerns  

## Project Structure

```
backend/
├── config/
│   └── database.js              # MySQL connection pool & initialization
├── controllers/
│   ├── HealthController.js      # Health check endpoints
│   └── DatabaseController.js    # Database connection endpoints
├── middleware/
│   └── errorHandler.js          # Global error handling
├── models/
│   ├── User.js                  # User database operations
│   └── Attendance.js            # Attendance database operations
├── routes/
│   ├── index.js                 # Main routes aggregator
│   ├── healthRoutes.js          # Health check routes
│   └── databaseRoutes.js        # Database test routes
├── utils/
│   └── logger.js                # Logging utility
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # NPM dependencies
└── server.js                    # Main entry point
```

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

**Update `.env` with your credentials:**

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

### 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Health Check

**GET /health**
```bash
curl http://localhost:3000/health
```

Response:
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

### Database Connection Test

**GET /db-test**
```bash
curl http://localhost:3000/db-test
```

Response:
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

### Database Status

**GET /db-status**
```bash
curl http://localhost:3000/db-status
```

Response:
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
      "TABLE_ROWS": 5
    },
    {
      "TABLE_NAME": "attendance",
      "TABLE_ROWS": 24
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  check_in DATETIME NOT NULL,
  check_out DATETIME,
  date DATE NOT NULL,
  duration_hours DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
)
```

## Models Usage

### User Model

```javascript
const User = require('./models/User');

// Create user
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed_password'
});

// Get user by ID
const user = await User.getById(1);

// Get user by email
const user = await User.getByEmail('john@example.com');

// Get all users with pagination
const result = await User.getAll(page=1, limit=10);

// Update user
const updated = await User.update(1, {
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// Delete user
await User.delete(1);
```

### Attendance Model

```javascript
const Attendance = require('./models/Attendance');

// Check in
const checkin = await Attendance.checkIn(userId);

// Check out
const checkout = await Attendance.checkOut(attendanceId);

// Get today's attendance
const today = await Attendance.getToday();

// Get user attendance history
const history = await Attendance.getByUserId(userId, page=1, limit=20);

// Get attendance by date range
const range = await Attendance.getByDateRange('2024-01-01', '2024-01-31');

// Get statistics
const stats = await Attendance.getStatistics(userId, '2024-01-01', '2024-01-31');

// Delete attendance record
await Attendance.delete(attendanceId);
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | Server port |
| `DB_HOST` | - | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | - | MySQL username |
| `DB_PASSWORD` | - | MySQL password |
| `DB_NAME` | - | Database name |
| `DB_POOL_LIMIT` | `10` | Connection pool size |
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |

## Dependencies

- **express** - Web framework
- **mysql2** - MySQL client with promise support
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **compression** - Response compression
- **morgan** - HTTP request logger
- **dotenv** - Environment variables

## Error Handling

All errors are caught and returned as JSON:

```json
{
  "success": false,
  "error": {
    "statusCode": 500,
    "message": "Internal Server Error"
  }
}
```

In development mode, stack traces are included. In production, only the error message is shown.

## Logging

The application uses a structured logging system with different levels:

- **ERROR** - Critical errors
- **WARN** - Warnings
- **INFO** - General information
- **DEBUG** - Debugging information

Set `LOG_LEVEL` in `.env` to control which messages are logged.

## Security Features

✅ **Helmet** - Sets security headers  
✅ **CORS** - Configurable cross-origin requests  
✅ **Request compression** - Reduces response size  
✅ **Rate limiting ready** - Easy to add  
✅ **Error masking** - Hides internal details in production  

## Development

### Run Development Server

```bash
npm run dev
```

The server will automatically restart on file changes (using nodemon).

### View Logs

All requests and errors are logged:

```
[2024-01-15T10:30:00.000Z] [INFO] GET /health
[2024-01-15T10:30:01.000Z] [INFO] GET /db-test
[2024-01-15T10:30:02.000Z] [DEBUG] User created with ID: 1
```

## Performance

- **Connection pooling** - Reuses database connections
- **Compression** - Gzips responses
- **Request limits** - Prevents large payloads
- **Efficient queries** - Indexed columns
- **Graceful shutdown** - Closes connections properly

## Contributing

1. Follow the project structure
2. Use meaningful commit messages
3. Test all endpoints before submitting
4. Update documentation for new features

## License

MIT

## Support

For issues or questions, contact your team administrator.
