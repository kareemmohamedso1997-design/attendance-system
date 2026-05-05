# Attendance System - API Documentation

Complete API reference for the Employee Attendance Tracking System.

---

## 🌐 Base URL

```
http://localhost:3000/api
```

All requests should include:
- **Content-Type:** application/json
- **Method:** POST (for check-in/check-out), GET (for retrieval)

---

## 📋 Endpoints

### 1. Employee Check-in

**Endpoint:** `POST /api/checkin`

Records the time an employee checks in.

**Request:**
```javascript
{
  "employee_id": 1
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employee_id | Integer | Yes | ID of the employee |

**Response (Success - 201):**
```javascript
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendance_id": 1,
    "employee_id": 1,
    "check_in": "2024-01-15T08:30:45.123Z"
  }
}
```

**Response (Error - Employee Not Found - 404):**
```javascript
{
  "success": false,
  "message": "Employee not found"
}
```

**Response (Error - Already Checked In - 409):**
```javascript
{
  "success": false,
  "message": "Employee is already checked in. Please check out first."
}
```

**Response (Error - Missing Parameter - 400):**
```javascript
{
  "success": false,
  "message": "Employee ID is required"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1}'
```

**JavaScript Fetch Example:**
```javascript
const response = await fetch('http://localhost:3000/api/checkin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ employee_id: 1 })
});

const data = await response.json();
if (data.success) {
  console.log('Checked in at:', data.data.check_in);
} else {
  console.error('Error:', data.message);
}
```

---

### 2. Employee Check-out

**Endpoint:** `POST /api/checkout`

Records the time an employee checks out and calculates working hours.

**Request:**
```javascript
{
  "employee_id": 1
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employee_id | Integer | Yes | ID of the employee |

**Response (Success - 200):**
```javascript
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "attendance_id": 1,
    "employee_id": 1,
    "check_in": "2024-01-15T08:30:45.123Z",
    "check_out": "2024-01-15T17:00:30.456Z",
    "working_hours": 8.5,
    "is_late": false
  }
}
```

**Response (Error - No Active Check-in - 409):**
```javascript
{
  "success": false,
  "message": "No active check-in found. Please check in first."
}
```

**Response (Error - Employee Not Found - 404):**
```javascript
{
  "success": false,
  "message": "Employee not found"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1}'
```

**JavaScript Fetch Example:**
```javascript
const response = await fetch('http://localhost:3000/api/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ employee_id: 1 })
});

const data = await response.json();
if (data.success) {
  console.log(`Worked ${data.data.working_hours} hours`);
  console.log(`Late: ${data.data.is_late ? 'Yes' : 'No'}`);
} else {
  console.error('Error:', data.message);
}
```

---

### 3. Get Attendance Records

**Endpoint:** `GET /api/attendance`

Retrieves attendance records with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employee_id | Integer | No | Filter by specific employee |
| date | String | No | Filter by specific date (YYYY-MM-DD) |
| from_date | String | No | Start date for range (YYYY-MM-DD) |
| to_date | String | No | End date for range (YYYY-MM-DD) |

**Response (Success - 200):**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "name": "John Doe",
      "check_in": "2024-01-15T08:30:45.123Z",
      "check_out": "2024-01-15T17:00:30.456Z",
      "working_hours": 8.5,
      "is_late": false,
      "attendance_date": "2024-01-15"
    },
    {
      "id": 2,
      "employee_id": 1,
      "name": "John Doe",
      "check_in": "2024-01-16T08:45:20.789Z",
      "check_out": "2024-01-16T17:15:10.101Z",
      "working_hours": 8.5,
      "is_late": true,
      "attendance_date": "2024-01-16"
    }
  ],
  "count": 2
}
```

**cURL Examples:**

Get all records:
```bash
curl http://localhost:3000/api/attendance
```

Get records for specific employee:
```bash
curl "http://localhost:3000/api/attendance?employee_id=1"
```

Get records for specific date:
```bash
curl "http://localhost:3000/api/attendance?date=2024-01-15"
```

Get records in date range:
```bash
curl "http://localhost:3000/api/attendance?from_date=2024-01-01&to_date=2024-01-31&employee_id=1"
```

**JavaScript Fetch Example:**
```javascript
// Get records for employee 1 in January 2024
const params = new URLSearchParams({
  employee_id: 1,
  from_date: '2024-01-01',
  to_date: '2024-01-31'
});

const response = await fetch(`http://localhost:3000/api/attendance?${params}`);
const data = await response.json();

if (data.success) {
  data.data.forEach(record => {
    console.log(`${record.name} - ${record.check_in} to ${record.check_out}`);
  });
  console.log(`Total records: ${data.count}`);
}
```

---

### 4. Get Employees List

**Endpoint:** `GET /api/employees`

Retrieves list of all employees.

**Query Parameters:** None

**Response (Success - 200):**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe"
    },
    {
      "id": 2,
      "name": "Jane Smith"
    },
    {
      "id": 3,
      "name": "Robert Johnson"
    }
  ],
  "count": 3
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/employees
```

**JavaScript Fetch Example:**
```javascript
const response = await fetch('http://localhost:3000/api/employees');
const data = await response.json();

if (data.success) {
  data.data.forEach(emp => {
    console.log(`${emp.id}: ${emp.name}`);
  });
}
```

---

### 5. Get Statistics

**Endpoint:** `GET /api/statistics`

Retrieves attendance statistics for an employee.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employee_id | Integer | Yes | ID of the employee |
| from_date | String | No | Start date (YYYY-MM-DD) |
| to_date | String | No | End date (YYYY-MM-DD) |

**Response (Success - 200):**
```javascript
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

**Response (Error - Missing employee_id - 400):**
```javascript
{
  "success": false,
  "message": "Employee ID is required"
}
```

**Field Descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| total_days | Integer | Number of days worked (unique check-in dates) |
| late_days | Integer | Number of late arrivals |
| total_working_hours | Decimal | Total hours worked |
| avg_working_hours | Decimal | Average hours per day |

**cURL Examples:**

Get statistics for employee 1:
```bash
curl "http://localhost:3000/api/statistics?employee_id=1"
```

Get statistics for January 2024:
```bash
curl "http://localhost:3000/api/statistics?employee_id=1&from_date=2024-01-01&to_date=2024-01-31"
```

**JavaScript Fetch Example:**
```javascript
const params = new URLSearchParams({
  employee_id: 1,
  from_date: '2024-01-01',
  to_date: '2024-01-31'
});

const response = await fetch(`http://localhost:3000/api/statistics?${params}`);
const data = await response.json();

if (data.success) {
  const stats = data.data;
  console.log(`Total Days: ${stats.total_days}`);
  console.log(`Late Days: ${stats.late_days}`);
  console.log(`Total Hours: ${stats.total_working_hours}`);
  console.log(`Average Hours/Day: ${stats.avg_working_hours}`);
}
```

---

## 📝 Request/Response Examples

### Complete Flow Example

```javascript
// 1. Get list of employees
const employeesRes = await fetch('http://localhost:3000/api/employees');
const employees = await employeesRes.json();
const employeeId = employees.data[0].id;

console.log(`Selected employee: ${employees.data[0].name}`);

// 2. Check-in
const checkinRes = await fetch('http://localhost:3000/api/checkin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ employee_id: employeeId })
});

const checkinData = await checkinRes.json();
if (checkinData.success) {
  console.log(`Checked in at: ${checkinData.data.check_in}`);
}

// 3. Get current attendance
const attendanceRes = await fetch(`http://localhost:3000/api/attendance?employee_id=${employeeId}`);
const attendance = await attendanceRes.json();
console.log(`Current status: ${attendance.data[0].check_out ? 'Checked Out' : 'Checked In'}`);

// 4. Check-out
const checkoutRes = await fetch('http://localhost:3000/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ employee_id: employeeId })
});

const checkoutData = await checkoutRes.json();
if (checkoutData.success) {
  console.log(`Checked out at: ${checkoutData.data.check_out}`);
  console.log(`Working hours: ${checkoutData.data.working_hours}`);
  console.log(`Late: ${checkoutData.data.is_late}`);
}

// 5. Get statistics
const statsRes = await fetch(`http://localhost:3000/api/statistics?employee_id=${employeeId}`);
const stats = await statsRes.json();
console.log(`Statistics for month:`, stats.data);
```

---

## 🔄 HTTP Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created (check-in successful) |
| 400 | Bad Request | Invalid parameters or missing required field |
| 404 | Not Found | Employee or resource not found |
| 409 | Conflict | Business rule violation (already checked in, no check-in found) |
| 500 | Server Error | Internal server error |

---

## 🔐 Error Handling

All error responses follow this format:

```javascript
{
  "success": false,
  "message": "Human-readable error message"
}
```

**Common Errors:**

1. **Employee not found**
   - Status: 404
   - Message: "Employee not found"
   - Cause: Invalid employee_id

2. **Already checked in**
   - Status: 409
   - Message: "Employee is already checked in. Please check out first."
   - Cause: Employee has active check-in without check-out

3. **No check-in found**
   - Status: 409
   - Message: "No active check-in found. Please check in first."
   - Cause: Trying to check out without check-in

4. **Missing parameters**
   - Status: 400
   - Message: "Employee ID is required"
   - Cause: Required parameter not provided

---

## 📊 Data Format

### Date/Time Format

- **Check-in/Check-out times:** ISO 8601 format (e.g., `2024-01-15T08:30:45.123Z`)
- **Date queries:** YYYY-MM-DD format (e.g., `2024-01-15`)

### Time Calculations

**Working Hours:**
- Calculated as decimal hours
- Formula: (check_out - check_in) / 3600 seconds
- Example: 8 hours 30 minutes = 8.5 hours

**Late Detection:**
- Configurable via `LATE_TIME` in .env (default: 09:00)
- Any check-in after this time is marked as late
- Stored as 1 (late) or 0 (on time) in database

---

## 🧪 Testing with Postman

### Import Collection

Use this collection in Postman:

```json
{
  "info": {
    "name": "Attendance System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Check In",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {"mode": "raw", "raw": "{\"employee_id\": 1}"},
        "url": {"raw": "http://localhost:3000/api/checkin", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "checkin"]}
      }
    },
    {
      "name": "Check Out",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {"mode": "raw", "raw": "{\"employee_id\": 1}"},
        "url": {"raw": "http://localhost:3000/api/checkout", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "checkout"]}
      }
    },
    {
      "name": "Get Attendance",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:3000/api/attendance?employee_id=1", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "attendance"], "query": [{"key": "employee_id", "value": "1"}]}
      }
    },
    {
      "name": "Get Employees",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:3000/api/employees", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "employees"]}
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:3000/api/statistics?employee_id=1", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "statistics"], "query": [{"key": "employee_id", "value": "1"}]}
      }
    }
  ]
}
```

---

## 🔗 Related Resources

- [Main README](README.md) - General documentation
- [Setup Guide](SETUP_GUIDE.md) - Installation instructions
- Database Schema: `database/schema.sql`
- Frontend Implementation: `client/js/main.js`, `client/js/admin.js`
- Backend Implementation: `server/controllers/attendanceController.js`

---

## 📚 Additional Notes

### Rate Limiting
Currently, there is no rate limiting. In production, consider implementing rate limiting to prevent abuse.

### Authentication
The current API has no authentication. For production, consider adding:
- JWT tokens
- Role-based access control
- API keys

### CORS
CORS is enabled for all origins. In production, restrict to specific origins:
```javascript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

---

**Last Updated:** 2024  
**API Version:** 1.0
