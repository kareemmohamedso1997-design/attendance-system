# Employee Attendance Tracking System

A complete, production-ready employee attendance tracking web application built with Node.js, Express, MySQL, and vanilla JavaScript.

## 🌟 Features

### Core Functionality
- ✅ **Check-in/Check-out System** - Employees can mark their presence with server-side timestamps
- ✅ **Late Detection** - Automatically marks check-ins after 9:00 AM as "Late"
- ✅ **Working Hours Calculation** - Automatically calculates total working hours
- ✅ **Multiple Check-in Prevention** - Prevents multiple active check-ins without check-out
- ✅ **Real-time Status** - Shows current check-in status for selected employee

### Admin Dashboard
- 📊 **Attendance Filtering** - Filter by employee, date range
- 📈 **Statistics** - View total days, late days, total working hours, average hours
- 📋 **Attendance Records** - Complete attendance history table
- 🔍 **Advanced Search** - Filter and search attendance records

### Security & Quality
- 🔒 **SQL Injection Prevention** - Uses parameterized queries
- ✅ **Input Validation** - All inputs are validated server-side
- 🛡️ **Error Handling** - Comprehensive error handling and user-friendly messages
- 📝 **Well-Commented Code** - Production-quality code with detailed comments
- 🎨 **Responsive Design** - Works on desktop and mobile devices

## 📁 Project Structure

```
attendance-system/
├── server/                          # Backend server
│   ├── config/
│   │   └── database.js             # Database configuration
│   ├── controllers/
│   │   └── attendanceController.js # Business logic
│   ├── middleware/
│   │   └── errorHandler.js         # Error handling
│   ├── routes/
│   │   └── attendance.js           # API routes
│   └── app.js                       # Express app setup
├── client/                          # Frontend
│   ├── index.html                  # Main check-in page
│   ├── admin.html                  # Admin dashboard
│   ├── css/
│   │   ├── style.css              # Main styles
│   │   └── admin-style.css        # Dashboard styles
│   └── js/
│       ├── main.js                # Main page logic
│       └── admin.js               # Dashboard logic
├── database/
│   └── schema.sql                  # Database schema
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore file
├── package.json                    # Dependencies
├── server.js                       # Entry point
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Download](https://www.mysql.com/downloads/)
- **npm** (comes with Node.js)

### Installation Steps

#### 1. Clone or Download the Project
```bash
cd attendance-system
```

#### 2. Install Node Dependencies
```bash
npm install
```

#### 3. Setup MySQL Database

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p < database/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Create new connection to your MySQL server
3. Open the schema.sql file
4. Execute the script

**Option C: Create Database Manually**
```sql
CREATE DATABASE attendance_db;
USE attendance_db;

-- Then run the contents of database/schema.sql
```

#### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_db
DB_PORT=3306

PORT=3000
NODE_ENV=development

LATE_TIME=09:00
```

**Example with common passwords:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_db
DB_PORT=3306

PORT=3000
NODE_ENV=development

LATE_TIME=09:00
```

#### 5. Start the Server

**Development Mode (with auto-restart on file changes):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════╗
║   Attendance System Server Running     ║
║   URL: http://localhost:3000           ║
║   Environment: development             ║
╚════════════════════════════════════════╝

✓ Database connected successfully
```

#### 6. Access the Application

Open your web browser and navigate to:

- **Check-in/Check-out Page:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

## 📱 User Guide

### Employee Check-in/Check-out Page

1. **Select Employee** - Choose your name from the dropdown
2. **Check In** - Click "Check In" button to mark arrival
3. **Check Out** - Click "Check Out" button to mark departure
4. **View Status** - Current check-in status is displayed
5. **Today's Records** - See all attendance for the day

### Admin Dashboard

1. **Filter Records** - Select employee and date range
2. **Apply Filter** - Click "Apply Filter" to view filtered records
3. **View Statistics** - Select employee and click "Show Statistics" for detailed analysis
4. **Statistics Displayed:**
   - Total Days Worked
   - Late Days
   - Total Working Hours
   - Average Working Hours per Day

## 🔌 API Endpoints

All endpoints require JSON request body (except GET requests)

### Check-in
```http
POST /api/checkin
Content-Type: application/json

{
  "employee_id": 1
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendance_id": 1,
    "employee_id": 1,
    "check_in": "2024-01-15T08:30:00.000Z"
  }
}
```

**Response (Error - Already checked in):**
```json
{
  "success": false,
  "message": "Employee is already checked in. Please check out first."
}
```

### Check-out
```http
POST /api/checkout
Content-Type: application/json

{
  "employee_id": 1
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "attendance_id": 1,
    "employee_id": 1,
    "check_in": "2024-01-15T08:30:00.000Z",
    "check_out": "2024-01-15T17:00:00.000Z",
    "working_hours": 8.5,
    "is_late": false
  }
}
```

### Get Attendance Records
```http
GET /api/attendance?employee_id=1&date=2024-01-15
```

**Query Parameters:**
- `employee_id` (optional) - Filter by employee
- `date` (optional) - Filter by specific date (YYYY-MM-DD)
- `from_date` (optional) - Start date (YYYY-MM-DD)
- `to_date` (optional) - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "name": "John Doe",
      "check_in": "2024-01-15T08:30:00.000Z",
      "check_out": "2024-01-15T17:00:00.000Z",
      "working_hours": 8.5,
      "is_late": false,
      "attendance_date": "2024-01-15"
    }
  ],
  "count": 1
}
```

### Get Employees List
```http
GET /api/employees
```

**Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John Doe"},
    {"id": 2, "name": "Jane Smith"}
  ],
  "count": 2
}
```

### Get Statistics
```http
GET /api/statistics?employee_id=1&from_date=2024-01-01&to_date=2024-01-31
```

**Query Parameters:**
- `employee_id` (required) - Employee ID
- `from_date` (optional) - Start date (YYYY-MM-DD)
- `to_date` (optional) - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_days": 20,
    "late_days": 3,
    "total_working_hours": 160.5,
    "avg_working_hours": 8.02
  }
}
```

## 🗄️ Database Schema

### Employees Table
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  check_in DATETIME NOT NULL,
  check_out DATETIME,
  working_hours DECIMAL(5, 2),
  is_late TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_id (employee_id),
  INDEX idx_check_in (check_in),
  INDEX idx_employee_check_in (employee_id, check_in)
)
```

## 🔒 Security Features

1. **SQL Injection Prevention**
   - All database queries use parameterized statements
   - User input is never directly concatenated into SQL

2. **Input Validation**
   - Employee ID validation
   - Date format validation
   - Required field validation

3. **Timestamp Protection**
   - Timestamps are generated server-side only
   - Clients cannot manipulate timestamps
   - ISO 8601 format used for consistency

4. **Error Handling**
   - Generic error messages to prevent information leakage
   - Detailed logging for debugging (development only)
   - Proper HTTP status codes

## 🧪 Testing the Application

### Test Case 1: Normal Check-in/Check-out
1. Select employee "John Doe"
2. Click "Check In" - should see success message
3. Wait a moment
4. Click "Check Out" - should see success message
5. Check "Today's Attendance" table - should show record with working hours

### Test Case 2: Multiple Check-ins (Prevention)
1. Select employee "Jane Smith"
2. Click "Check In" - success
3. Click "Check In" again - should see error "Already checked in"
4. Click "Check Out" - success

### Test Case 3: Check-out without Check-in
1. Select employee "Robert Johnson"
2. Click "Check Out" - should see error "No active check-in found"

### Test Case 4: Late Detection
1. Check-in between 9:00 AM and 9:59 AM
2. Verify "Status" shows "Late" badge in dashboard

### Test Case 5: Statistics
1. Go to Admin Dashboard
2. Select an employee with multiple days of records
3. Set date range
4. Click "Show Statistics" - should display total days, late days, hours

## 📊 Sample Data

The database comes with 8 sample employees:
- John Doe
- Jane Smith
- Robert Johnson
- Maria Garcia
- Ahmed Hassan
- Sarah Williams
- Michael Brown
- Lisa Anderson

To add more employees:
```sql
INSERT INTO employees (name) VALUES ('New Employee Name');
```

## 🐛 Troubleshooting

### Issue: "Database connection failed"
**Solution:**
1. Verify MySQL is running
2. Check credentials in .env file
3. Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`
4. Recreate database: `mysql -u root -p < database/schema.sql`

### Issue: "Cannot GET /"
**Solution:**
1. Check if server is running on port 3000
2. Try http://localhost:3000 (with http://)
3. Check console for error messages

### Issue: "No employees showing in dropdown"
**Solution:**
1. Verify database has employees table with data
2. Check API is accessible: http://localhost:3000/api/employees
3. Check browser console for JavaScript errors

### Issue: "Port 3000 is already in use"
**Solution:**
1. Change port in .env file: `PORT=3001`
2. Or kill the existing process on port 3000

## 📈 Performance Optimization

The application includes several optimizations:
- **Database Indexes** - Indexed columns for faster queries
- **Connection Pooling** - Reuses MySQL connections
- **Efficient Queries** - Uses SELECT only needed columns
- **Client-side Caching** - Reduces API calls

## 🔄 API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (Check-in successful) |
| 400 | Bad Request (Missing parameters) |
| 404 | Not Found (Employee not found) |
| 409 | Conflict (Already checked in) |
| 500 | Server Error |

## 📝 Development Notes

### Adding New Employees
```javascript
// The application can be extended to add employees via API
// Currently, use SQL: INSERT INTO employees (name) VALUES ('New Name');
```

### Changing Late Time
Edit the `LATE_TIME` in `.env`:
```env
LATE_TIME=09:30  # Changes late time to 9:30 AM
```

### Extending the Application

To add new features:
1. Create controller functions in `server/controllers/`
2. Add routes in `server/routes/`
3. Call API from frontend JavaScript files
4. Update UI in HTML files

## 📜 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ as a production-ready attendance system.

---

## ⚡ Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Setup database
mysql -u root -p < database/schema.sql

# Create .env file from template
cp .env.example .env
```

## 🎯 Next Steps

1. ✅ Install Node.js and MySQL
2. ✅ Clone/download this project
3. ✅ Run `npm install`
4. ✅ Setup `.env` file with your credentials
5. ✅ Run `mysql -u root -p < database/schema.sql`
6. ✅ Start server with `npm run dev`
7. ✅ Open http://localhost:3000 in browser

**Enjoy your attendance tracking system! 🎉**
