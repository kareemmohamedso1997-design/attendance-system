# Attendance System - Step-by-Step Setup Guide

This guide will walk you through setting up and running the Employee Attendance Tracking System on your Windows machine.

---

## ✅ Step 1: Download and Install Required Software

### 1.1 Download Node.js
1. Visit https://nodejs.org/
2. Click on the **LTS (Long Term Support)** version
3. Download the Windows Installer
4. Run the installer and follow the setup wizard
5. Select "Add to PATH" (should be checked by default)
6. Complete the installation

**Verify Installation:**
```bash
node --version
npm --version
```

### 1.2 Download and Install MySQL
1. Visit https://dev.mysql.com/downloads/mysql/
2. Download **MySQL Community Server** (choose your OS version)
3. Run the installer
4. Follow setup wizard and choose:
   - Setup Type: **Developer Default**
   - MySQL Server (Port: 3306)
   - MySQL Workbench (optional but helpful)
5. When prompted for MySQL Root Password:
   - **Important:** Remember or write down this password!
   - If you leave it blank, use blank in your .env file
6. Complete installation

**Verify Installation:**
Open Command Prompt and type:
```bash
mysql --version
```

### 1.3 Install Git (Optional but Recommended)
1. Visit https://git-scm.com/download/win
2. Download and run the installer
3. Use default settings

---

## ✅ Step 2: Download/Clone the Project

### Option A: If using Git
```bash
git clone <repository-url>
cd attendance-system
```

### Option B: If using ZIP file
1. Extract the ZIP file to your desired location
2. Open Command Prompt (cmd.exe)
3. Navigate to the project folder:
```bash
cd path\to\attendance-system
```

---

## ✅ Step 3: Install Node Dependencies

In the Command Prompt (in the project directory), run:

```bash
npm install
```

This will download and install all required packages. This may take a few minutes.

**Expected Output:**
```
added XX packages in X.XXs
```

---

## ✅ Step 4: Setup the MySQL Database

### 4.1 Open MySQL Command Prompt

**Option A: Using MySQL Command Line Client**
1. Open Command Prompt (cmd.exe)
2. Type: `mysql -u root -p`
3. Enter your MySQL root password (if you set one during installation)
4. You should see: `mysql>`

**Option B: Using MySQL Workbench (GUI)**
1. Open MySQL Workbench
2. Connect to your MySQL instance
3. File → Open SQL Script → Select `database/schema.sql`

### 4.2 Import the Database Schema

**Using MySQL Command Line (Method 1):**
```bash
mysql -u root -p < database\schema.sql
```

Then enter your MySQL password when prompted.

**Using MySQL Command Line (Method 2):**
```bash
mysql -u root -p
# Then type:
source database/schema.sql;
```

**Using MySQL Workbench:**
1. Open the schema.sql file in Workbench
2. Click the lightning bolt icon to execute
3. Click "Yes" to all prompts

**Verify Database Creation:**
```sql
SHOW DATABASES;
USE attendance_db;
SHOW TABLES;
SELECT * FROM employees;
```

You should see 8 sample employees listed.

---

## ✅ Step 5: Configure Environment Variables

### 5.1 Create .env File

In the project root directory, create a new file named `.env`

You can do this by:

**Method 1: Using Command Prompt**
```bash
copy .env.example .env
```

**Method 2: Using a Text Editor**
1. Open Notepad
2. Copy the contents from `.env.example` file in the project
3. Save as `.env` (make sure it doesn't save as `.env.txt`)

### 5.2 Edit .env File with Your Credentials

Open the `.env` file and update the database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# Business Logic Configuration
LATE_TIME=09:00
```

**Examples:**

**Example 1: No MySQL password**
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

**Example 2: With MySQL password**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=MyPassword123
DB_NAME=attendance_db
DB_PORT=3306
PORT=3000
NODE_ENV=development
LATE_TIME=09:00
```

**Example 3: Custom late time (10:00 AM instead of 9:00 AM)**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_db
DB_PORT=3306
PORT=3000
NODE_ENV=development
LATE_TIME=10:00
```

---

## ✅ Step 6: Start the Application

### 6.1 Start Development Server (Recommended for first run)

In Command Prompt (in the project directory):

```bash
npm run dev
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

### 6.2 Start Production Server

```bash
npm start
```

---

## ✅ Step 7: Access the Application

### 7.1 Open in Web Browser

Once the server is running, open your web browser and go to:

**Check-in/Check-out Page:**
```
http://localhost:3000
```

**Admin Dashboard:**
```
http://localhost:3000/admin
```

### 7.2 Test the Application

#### Check-in/Check-out Page:
1. Select an employee from the dropdown (e.g., "John Doe")
2. Click "Check In" button
3. You should see a success message
4. Check "Current Status" section - should show check-in time
5. Click "Check Out" button
6. You should see a success message
7. Check "Today's Attendance" table - should show the record

#### Admin Dashboard:
1. The dashboard shows a calendar-like filter
2. Select an employee
3. Set a date range
4. Click "Apply Filter"
5. You should see attendance records in the table below
6. To see statistics:
   - Select an employee from "Select Employee" dropdown
   - Click "Show Statistics"
   - View the statistics cards

---

## 🔧 Troubleshooting

### Problem: "Cannot find module 'express'"
**Solution:**
```bash
npm install
```
Wait for all packages to install.

### Problem: "Error: connect ECONNREFUSED"
**Solution:**
1. Check if MySQL is running
2. Verify database credentials in .env file
3. Try connecting to MySQL directly: `mysql -u root -p`

### Problem: "Error: listen EADDRINUSE: address already in use :::3000"
**Solution:**
The port 3000 is already in use. Either:
- Close other Node.js applications
- Or change PORT in .env to 3001, 3002, etc.

### Problem: "No employees showing in dropdown"
**Solution:**
1. Verify MySQL database was created: `mysql -u root -p`
2. Check database: `USE attendance_db; SELECT * FROM employees;`
3. If no employees, re-run: `mysql -u root -p < database\schema.sql`

### Problem: "Access denied for user 'root'@'localhost'"
**Solution:**
1. Verify MySQL password in .env file is correct
2. If you forgot password, follow MySQL recovery steps
3. Or reinstall MySQL and set a new password

### Problem: "Connection timeout"
**Solution:**
1. Ensure MySQL server is running
2. Check if port 3306 is correct (or your custom port)
3. Windows Firewall might be blocking - allow MySQL through Firewall

---

## 📊 Adding More Employees

### Using MySQL Command Line:
```bash
mysql -u root -p attendance_db
```

Then:
```sql
INSERT INTO employees (name) VALUES ('Employee Name');
```

Example:
```sql
INSERT INTO employees (name) VALUES 
('Ali Khan'),
('Fatima Ahmed'),
('Hassan Ibrahim');
```

### Using MySQL Workbench:
1. Right-click on `employees` table
2. Select "Select Rows"
3. Click the green "+" icon to add new row
4. Enter employee name
5. Click the check mark to save

---

## 🚀 Running Commands Reference

### Development Mode (with auto-reload on file changes):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Setup Database:
```bash
mysql -u root -p < database\schema.sql
```

### Verify MySQL Connection:
```bash
mysql -u root -p -h localhost
```

### Stop the Server:
Press `Ctrl + C` in Command Prompt

---

## 📁 Project Structure Summary

```
attendance-system/
├── server/                      # Backend code
│   ├── config/database.js      # Database connection
│   ├── controllers/            # Business logic
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Error handling
│   └── app.js                  # Express app
├── client/                      # Frontend code
│   ├── index.html              # Main page
│   ├── admin.html              # Dashboard
│   ├── css/                    # Stylesheets
│   └── js/                     # JavaScript
├── database/
│   └── schema.sql              # Database schema
├── .env                        # Your config file (create this)
├── .env.example                # Template config
├── package.json                # Dependencies
├── server.js                   # Entry point
└── README.md                   # Documentation
```

---

## 🎯 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkin` | Check-in employee |
| POST | `/api/checkout` | Check-out employee |
| GET | `/api/attendance` | Get attendance records |
| GET | `/api/employees` | Get employee list |
| GET | `/api/statistics` | Get employee statistics |

---

## ⏰ Late Time Configuration

By default, any check-in after 09:00 AM is marked as "Late".

To change this:
1. Edit `.env` file
2. Change `LATE_TIME=09:00` to desired time
3. Restart the server
4. Reload the application in browser

Examples:
- `LATE_TIME=08:00` - Late after 8:00 AM
- `LATE_TIME=10:00` - Late after 10:00 AM
- `LATE_TIME=09:30` - Late after 9:30 AM

---

## 📱 Browser Compatibility

The application works on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (responsive design)

---

## 🔐 Important Security Notes

1. **Do NOT commit .env file to Git** - It contains sensitive credentials
2. **Keep your MySQL password secure** - Use strong passwords in production
3. **Server timestamps are secure** - Clients cannot modify them
4. **All inputs are validated** - SQL injection is prevented

---

## 📞 Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Verify all prerequisites are installed
3. Check error messages in Command Prompt
4. Review the main README.md file

---

## 🎉 You're All Set!

Your attendance system is now ready to use. 

### Quick Checklist:
- [ ] Node.js installed
- [ ] MySQL installed and running
- [ ] Database created with schema.sql
- [ ] .env file configured
- [ ] Dependencies installed with npm install
- [ ] Server running (npm run dev)
- [ ] Application accessible at http://localhost:3000

**Enjoy your attendance tracking system!** ✨
