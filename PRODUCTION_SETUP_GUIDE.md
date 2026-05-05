# 🚀 Production-Ready Attendance System - Complete Setup Guide

## ✨ NEW FEATURES (v2.0)

### 1. **Authentication System (JWT)**
- Secure login with username/email and password
- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Role-based access control (Admin/Employee)
- Token refresh mechanism
- Account lockout after failed login attempts (5 attempts, 15 minutes)
- Last login tracking

### 2. **Security Features**
- SQL injection prevention (parameterized queries)
- Input validation on all endpoints
- CORS protection
- Helmet.js security headers
- Rate limiting (100 requests per 15 min globally, 5 per 15 min for auth)
- Password requirements: 8+ chars, uppercase, lowercase, numbers
- Secure password reset capability
- Audit logging

### 3. **GPS Location Tracking**
- Capture GPS coordinates on check-in and check-out
- Geofencing: Define allowed location radius (default 500m)
- Location validation before check-in
- Store location history in database
- IP address and user agent tracking

### 4. **Advanced Attendance Logic**
- Automatic working hours calculation (decimal format: 8.5 hours)
- Overtime calculation (hours > 8 per day)
- Late detection (customizable time, default 09:00)
- Lock records after checkout (prevent tampering)
- Single open attendance record per employee guarantee
- Timezone handling with server timestamps

### 5. **Reporting & Export**
- Export reports as Excel (.xlsx) with formatted headers
- Export reports as PDF with summary statistics
- Department-wise reporting (admin only)
- Summary statistics: total days, late days, total/avg hours, overtime
- Date range filtering
- Employee-specific or all employees

### 6. **Role-Based Access**
- **Admin**: View all records, dashboard, statistics, reports, department analytics
- **Employee**: Check-in/out, view own records only
- Middleware-based access control

---

## 📋 SETUP INSTRUCTIONS

### Step 1: Install NPM Dependencies

```bash
cd "C:\Users\Kareem Omar\OneDrive\سطح المكتب\attendance-system"
npm install
```

**Required Packages Installed:**
- express (4.18.2) - Web framework
- mysql2 (3.6.0) - Database driver with promises
- jsonwebtoken (9.1.0) - JWT authentication
- bcryptjs (2.4.3) - Password hashing
- express-validator (7.0.0) - Input validation
- express-rate-limit (7.1.5) - Rate limiting
- helmet (7.1.0) - Security headers
- joi (17.11.0) - Schema validation
- xlsx (0.18.5) - Excel generation
- pdfkit (0.13.0) - PDF generation
- validator (13.11.0) - String validation
- cors (2.8.5) - CORS middleware
- dotenv (16.3.1) - Environment variables

---

### Step 2: Update Database (With XAMPP)

Open Command Prompt or PowerShell and run:

```bash
# Using PowerShell (if MySQL is in PATH)
Get-Content "C:\Users\Kareem Omar\OneDrive\سطح المكتب\attendance-system\database\schema.sql" | &"C:\xampp\mysql\bin\mysql" -u root --password=""

# OR manually in XAMPP:
# 1. Open XAMPP Control Panel
# 2. Click "Admin" button for MySQL (opens phpMyAdmin)
# 3. Click "SQL" tab
# 4. Copy contents of schema.sql file and paste
# 5. Click "Go"
```

**Database Schema Includes:**
- `roles` - Admin/Employee roles
- `employees` - Employee details with location preferences
- `users` - Login credentials with password hashes
- `attendance` - Check-in/out records with GPS data
- `attendance_locations` - Location history
- `audit_logs` - All actions for compliance

**Pre-loaded Demo Data:**
- 8 employees with full details
- Demo user credentials (see below)

---

### Step 3: Configure Environment Variables

Edit `.env` file in project root:

```env
# DATABASE
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_db
DB_PORT=3306

# SERVER
PORT=3000
NODE_ENV=development

# JWT SECURITY
JWT_SECRET=change_this_to_a_strong_secret_key_in_production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# BCRYPT
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# GPS
ENABLE_LOCATION_TRACKING=true
LOCATION_RADIUS_METERS=500
REQUIRE_LOCATION_FOR_CHECKIN=false

# ATTENDANCE RULES
LATE_TIME=09:00
WORK_HOURS_PER_DAY=8
OVERTIME_THRESHOLD=8

# LOGGING
LOG_LEVEL=debug
ENABLE_AUDIT_LOG=true
```

---

### Step 4: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

**Expected Output:**
```
╔═══════════════════════════════════════════════╗
║  Production-Ready Attendance System Running   ║
║  URL: http://localhost:3000                   ║
║  Environment: development                     ║
║  JWT Secret: Configured                       ║
║  Database: Connected Successfully             ║
╚═══════════════════════════════════════════════╝
```

---

## 🔐 Demo Login Credentials

### Admin Account
- **Username**: admin (create via API or direct DB insert)
- **Password**: Password123

### Employee Accounts
```
john.doe        / Password123
jane.smith      / Password123
robert.johnson  / Password123
maria.garcia    / Password123
ahmed.hassan    / Password123
sarah.williams  / Password123
michael.brown   / Password123
lisa.anderson   / Password123
```

---

## 📱 APPLICATION URLS

| Page | URL | Role | Description |
|------|-----|------|-------------|
| **Login** | http://localhost:3000/login | All | Secure login page |
| **Employee Dashboard** | http://localhost:3000 | Employee | Check-in/check-out |
| **Admin Dashboard** | http://localhost:3000/admin | Admin | View all records & reports |
| **Health Check** | http://localhost:3000/api/health | Any | Server status |

---

## 📡 API ENDPOINTS

### Authentication Routes

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john.doe",
  "password": "Password123"
}

Response:
{
  "status": "success",
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "employee_id": 1,
      "username": "john.doe",
      "role": "employee"
    }
  }
}
```

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "new.user",
  "email": "new@company.com",
  "password": "SecurePass123",
  "employee_id": 1
}
```

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

### Attendance Routes

```http
POST /api/attendance/checkin
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "employee_id": 1,
  "latitude": 25.2048,
  "longitude": 55.2708
}
```

```http
POST /api/attendance/checkout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "employee_id": 1,
  "latitude": 25.2048,
  "longitude": 55.2708
}
```

```http
GET /api/attendance
Authorization: Bearer {accessToken}
?employee_id=1&from_date=2026-05-01&to_date=2026-05-31&limit=100&offset=0
```

```http
GET /api/attendance/today
Authorization: Bearer {accessToken}
```

```http
GET /api/attendance/status/{employeeId}
Authorization: Bearer {accessToken}
```

```http
GET /api/attendance/employees
Authorization: Bearer {accessToken}
```

```http
GET /api/statistics
Authorization: Bearer {accessToken}
?employee_id=1&from_date=2026-05-01&to_date=2026-05-31
```

### Reports Routes

```http
GET /api/reports/export
Authorization: Bearer {accessToken}
?employee_id=1&from_date=2026-05-01&to_date=2026-05-31&format=excel
```

```http
GET /api/reports/summary
Authorization: Bearer {accessToken}
?employee_id=1&from_date=2026-05-01&to_date=2026-05-31
```

```http
GET /api/reports/department
Authorization: Bearer {accessToken}
?department=Engineering&from_date=2026-05-01&to_date=2026-05-31
(Admin only)
```

---

## 🗂️ Project Structure

```
attendance-system/
├── server.js                          # Entry point
├── server/
│   ├── app.js                         # Express app config
│   ├── config/
│   │   └── database.js                # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js          # Authentication logic
│   │   ├── attendanceController.js    # Attendance operations
│   │   └── reportController.js        # Report generation
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT verification
│   │   ├── validationMiddleware.js    # Input validation
│   │   ├── rateLimitMiddleware.js     # Rate limiting
│   │   └── errorHandler.js            # Error handling
│   ├── routes/
│   │   ├── authRoutes.js              # Auth endpoints
│   │   ├── attendanceRoutes.js        # Attendance endpoints
│   │   └── reportRoutes.js            # Report endpoints
│   └── utils/
│       ├── tokenUtils.js              # JWT functions
│       ├── validators.js              # Input validation
│       ├── exportUtils.js             # Excel/PDF generation
│       └── logger.js                  # Logging utility
├── client/
│   ├── login.html                     # Login page
│   ├── index.html                     # Employee dashboard
│   ├── admin.html                     # Admin dashboard
│   ├── css/
│   │   ├── login-style.css           # Login styling
│   │   ├── style.css                  # Employee dashboard styling
│   │   └── admin-style.css            # Admin dashboard styling
│   └── js/
│       ├── login.js                   # Login functionality
│       ├── main.js                    # Employee dashboard JS
│       └── admin.js                   # Admin dashboard JS
├── database/
│   └── schema.sql                     # Database structure
├── package.json                       # Dependencies
├── .env                               # Configuration
└── README.md                          # This file
```

---

## 🔑 Key Security Features

1. **Password Security**
   - Bcrypt hashing with 10 rounds
   - Minimum 8 characters
   - Requires uppercase, lowercase, and numbers
   - Hashed passwords never stored in plain text

2. **Token Security**
   - JWT tokens with expiration (7 days default)
   - Refresh tokens for obtaining new access tokens
   - Tokens stored in localStorage (client-side)
   - Server-side token validation on every request

3. **Rate Limiting**
   - 100 requests per 15 minutes globally
   - 5 login attempts per 15 minutes (account lockout)
   - 20 attendance operations per minute

4. **Access Control**
   - Employees can only access their own data
   - Admins can view all data
   - Middleware-based role checking
   - Encrypted passwords in database

5. **Data Integrity**
   - Parameterized SQL queries (prevents SQL injection)
   - Input validation on all endpoints
   - GPS location validation
   - Locked records prevent post-checkout modifications

6. **Audit Trail**
   - All logins tracked (last_login field)
   - Failed login attempts recorded
   - Account lockout tracking
   - Optional audit logging for compliance

---

## 📊 Features by Role

### Employee Capabilities
- ✅ Secure login with username/email
- ✅ Check-in with optional GPS location
- ✅ Check-out with automatic hours calculation
- ✅ View own attendance records
- ✅ See current status (checked in/out)
- ✅ View own statistics (working days, late days, total hours)
- ✅ Export own attendance as Excel/PDF
- ✅ Real-time dashboard updates

### Admin Capabilities
- ✅ All employee features
- ✅ View all employee records
- ✅ Advanced date range filtering
- ✅ Department-wise reporting
- ✅ Employee statistics for any date range
- ✅ Export reports (Excel/PDF)
- ✅ View audit logs
- ✅ Manage employee locations
- ✅ Monitor system health

---

## 🧪 Testing the System

### Test 1: Login & Authentication
1. Open http://localhost:3000/login
2. Enter: username `john.doe`, password `Password123`
3. Verify: Token in localStorage, dashboard loads

### Test 2: Check-in/Check-out
1. Select employee from dropdown
2. Click "Check In" button
3. Verify: Status updates to "Checked In"
4. Click "Check Out" button
5. Verify: Hours calculated, status updates, record appears in table

### Test 3: Location Tracking (Optional)
1. Set `REQUIRE_LOCATION_FOR_CHECKIN=true` in `.env`
2. Browser will request location permission
3. Check-in only works if within allowed radius

### Test 4: Report Generation
1. Go to admin dashboard
2. Click "Show Statistics"
3. Click "Export as Excel" or "Export as PDF"
4. Verify: File downloads with correct data

### Test 5: Rate Limiting
1. Try making 6 login attempts in rapid succession
2. 6th attempt should fail with "Account locked" message

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"
- Solution: Ensure XAMPP MySQL is running, check DB credentials in .env

### Issue: "Token expired"
- Solution: Use refresh endpoint or login again

### Issue: "JWT Secret not configured"
- Solution: Set JWT_SECRET in .env file

### Issue: "Cannot find location"
- Solution: Browser may block geolocation, allow permissions or set REQUIRE_LOCATION_FOR_CHECKIN=false

### Issue: "Rate limit exceeded"
- Solution: Wait 15 minutes or modify RATE_LIMIT_WINDOW_MS in .env

---

## 📈 Performance Optimization

- Connection pooling (10 concurrent MySQL connections)
- Database indexes on frequently queried fields (employee_id, check_in, composite)
- Query optimization with LIMIT/OFFSET
- Client-side caching of tokens
- Auto-refresh every 30 seconds instead of real-time

---

## 🚀 Production Deployment Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Use environment-specific .env files
- [ ] Set up SSL certificates
- [ ] Configure CORS_ORIGIN to production domain
- [ ] Enable ENABLE_AUDIT_LOG=true
- [ ] Set up database backups
- [ ] Configure rate limiting based on expected load
- [ ] Set up monitoring and alerting
- [ ] Review and test all security features
- [ ] Enable production logging
- [ ] Set up error tracking (Sentry, etc.)

---

## 📞 Support

For issues or questions:
1. Check logs in `/logs` directory
2. Review error messages in browser console
3. Check database connection with `SELECT 1` in MySQL
4. Verify all .env variables are set correctly
5. Ensure XAMPP MySQL is running

---

**System Version**: 2.0 (Production-Ready)  
**Last Updated**: May 5, 2026  
**License**: MIT
