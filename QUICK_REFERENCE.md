# Quick Reference & Checklist

## 🚀 Installation Checklist

### Prerequisites
- [ ] Windows OS (7, 8, 10, 11)
- [ ] Administrator access to install software
- [ ] Stable internet connection

### Software Installation
- [ ] Download and install Node.js (LTS version)
- [ ] Verify Node.js: `node --version`
- [ ] Verify npm: `npm --version`
- [ ] Download and install MySQL (LTS version)
- [ ] Verify MySQL: `mysql --version`
- [ ] (Optional) Install Git for version control
- [ ] (Optional) Install MySQL Workbench for GUI management

### Project Setup
- [ ] Extract/Clone project to desired location
- [ ] Navigate to project directory in Command Prompt
- [ ] Run `npm install` to install dependencies
- [ ] Wait for installation to complete
- [ ] Copy `.env.example` to `.env`
- [ ] Edit `.env` with your database credentials

### Database Setup
- [ ] Open MySQL Command Prompt or Workbench
- [ ] Run database schema: `mysql -u root -p < database\schema.sql`
- [ ] Verify database creation: `SHOW DATABASES;`
- [ ] Verify tables: `USE attendance_db; SHOW TABLES;`
- [ ] Verify sample data: `SELECT * FROM employees;`

### Application Launch
- [ ] Start MySQL server (should be running)
- [ ] Open Command Prompt in project directory
- [ ] Run `npm run dev` to start development server
- [ ] Verify output includes: "Database connected successfully"
- [ ] Verify output includes: "Attendance System Server Running"
- [ ] Open browser: http://localhost:3000
- [ ] Test Check-in page loads
- [ ] Test Admin page loads at http://localhost:3000/admin

### Functionality Testing
- [ ] Check-in button works
- [ ] Check-out button works
- [ ] Employee dropdown populates
- [ ] Success messages appear
- [ ] Error messages appear for duplicate check-ins
- [ ] Attendance table shows records
- [ ] Admin dashboard filters work
- [ ] Statistics calculations are correct

---

## 📋 File Locations & Purposes

| File/Folder | Purpose |
|-------------|---------|
| `server.js` | Entry point - starts the server |
| `server/app.js` | Express app configuration |
| `server/config/database.js` | MySQL connection setup |
| `server/controllers/attendanceController.js` | Business logic for check-in/out |
| `server/routes/attendance.js` | API route definitions |
| `server/middleware/errorHandler.js` | Global error handling |
| `client/index.html` | Check-in/Check-out page |
| `client/admin.html` | Admin dashboard page |
| `client/js/main.js` | Frontend logic for main page |
| `client/js/admin.js` | Frontend logic for admin page |
| `client/css/style.css` | Styles for main page |
| `client/css/admin-style.css` | Styles for admin page |
| `database/schema.sql` | Database table definitions |
| `.env` | Configuration file (create from .env.example) |
| `package.json` | Project dependencies |
| `README.md` | Main documentation |
| `SETUP_GUIDE.md` | Step-by-step setup instructions |
| `API_DOCUMENTATION.md` | API reference guide |

---

## 🔧 Common Commands

### Server Management
```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Stop server
Ctrl + C (in Command Prompt)
```

### Database Management
```bash
# Connect to MySQL
mysql -u root -p

# Create database from schema
mysql -u root -p < database\schema.sql

# Backup database
mysqldump -u root -p attendance_db > backup.sql

# Restore database
mysql -u root -p attendance_db < backup.sql
```

### Project Management
```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Useful MySQL Commands
```sql
-- Show all databases
SHOW DATABASES;

-- Use specific database
USE attendance_db;

-- Show all tables
SHOW TABLES;

-- Show table structure
DESCRIBE employees;
DESCRIBE attendance;

-- View all employees
SELECT * FROM employees;

-- View all attendance records
SELECT * FROM attendance;

-- Add new employee
INSERT INTO employees (name) VALUES ('Employee Name');

-- View late employees
SELECT * FROM attendance WHERE is_late = 1;

-- View records for specific date
SELECT * FROM attendance WHERE DATE(check_in) = '2024-01-15';

-- Delete a record
DELETE FROM attendance WHERE id = 1;

-- Delete an employee
DELETE FROM employees WHERE id = 1;
```

---

## 🌐 URL References

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Check-in/Check-out page |
| http://localhost:3000/admin | Admin dashboard |
| http://localhost:3000/api/employees | API - Get employees list |
| http://localhost:3000/api/attendance | API - Get attendance records |
| http://localhost:3000/api/statistics | API - Get statistics |

---

## 🔄 .env Configuration Examples

### Minimal Setup (No Password)
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

### With Password
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=attendance_db
DB_PORT=3306
PORT=3000
NODE_ENV=development
LATE_TIME=09:00
```

### Custom Port (if 3000 is in use)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_db
DB_PORT=3306
PORT=3001
NODE_ENV=development
LATE_TIME=09:00
```

### Custom Late Time
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_db
DB_PORT=3306
PORT=3000
NODE_ENV=development
LATE_TIME=10:30
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot find module 'express' | Run `npm install` |
| Database connection failed | Check MySQL is running, verify credentials in .env |
| Port 3000 in use | Change PORT in .env to different number |
| No employees in dropdown | Verify schema.sql was run, check employees table has data |
| Cannot access localhost:3000 | Verify server is running, try http:// not https:// |
| Module 'dotenv' not found | Run `npm install dotenv` |
| "Cannot GET /" | Make sure `/client/index.html` exists |

---

## 📊 API Quick Reference

### Check-In
```bash
curl -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1}'
```

### Check-Out
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1}'
```

### Get Attendance
```bash
curl "http://localhost:3000/api/attendance?employee_id=1"
```

### Get Employees
```bash
curl "http://localhost:3000/api/employees"
```

### Get Statistics
```bash
curl "http://localhost:3000/api/statistics?employee_id=1"
```

---

## 🎨 Frontend Features

### Main Page (index.html)
- Employee dropdown selector
- Check-in button
- Check-out button
- Current status display
- Today's attendance table
- Success/error message alerts

### Admin Page (admin.html)
- Employee filter dropdown
- Date range filters
- Attendance records table
- Statistics section with:
  - Total days worked
  - Late days count
  - Total working hours
  - Average hours per day

---

## 🔐 Security Checklist

- [ ] `.env` file is NOT in git repository
- [ ] Database password is strong and stored securely
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] All user inputs are validated server-side
- [ ] Timestamps are generated server-side only
- [ ] Error messages don't expose sensitive information
- [ ] CORS is configured appropriately
- [ ] Database backups are created regularly

---

## 📈 Performance Tips

1. **Database Optimization**
   - Indexes are already created on key columns
   - Queries use LIMIT to avoid returning large datasets

2. **Frontend Optimization**
   - Auto-refresh set to 30 seconds (not too frequent)
   - Only necessary columns are fetched from API

3. **Server Optimization**
   - Connection pooling is enabled
   - Error handling prevents crashes
   - Proper HTTP status codes are used

---

## 🚀 Production Deployment Preparation

### Before Going Live
- [ ] Change NODE_ENV to 'production'
- [ ] Use strong MySQL password
- [ ] Set LATE_TIME to your company's actual late time
- [ ] Configure CORS for your domain
- [ ] Add authentication/authorization
- [ ] Add rate limiting
- [ ] Set up database backups
- [ ] Configure SSL/HTTPS
- [ ] Add request logging
- [ ] Test all features thoroughly
- [ ] Create data backup before first deployment

### Production .env Example
```env
DB_HOST=production-db-server.com
DB_USER=attendance_user
DB_PASSWORD=strong_password_here
DB_NAME=attendance_db
DB_PORT=3306
PORT=3000
NODE_ENV=production
LATE_TIME=09:00
```

---

## 📞 Support Resources

### Documentation
- `README.md` - Main documentation
- `SETUP_GUIDE.md` - Installation guide
- `API_DOCUMENTATION.md` - API reference

### External Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## ✅ Daily Usage Workflow

### For Employees
1. Navigate to http://localhost:3000
2. Select your name
3. Click "Check In" when you arrive
4. Click "Check Out" when you leave
5. View your attendance in the table

### For Admin
1. Navigate to http://localhost:3000/admin
2. Use filters to find specific records
3. View statistics for performance tracking
4. Export/analyze data as needed

---

## 📝 Notes

- **Late Time:** Configurable via LATE_TIME in .env (default 09:00)
- **Working Hours:** Calculated automatically from check-in to check-out
- **Database:** Automatic timezone handling with ISO 8601 format
- **Timestamps:** Server-based, cannot be manipulated by clients
- **Backup:** Always backup database before major changes

---

**Version:** 1.0  
**Last Updated:** January 2024  
**Status:** Production Ready ✅
