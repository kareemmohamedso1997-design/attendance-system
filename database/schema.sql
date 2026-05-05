/**
 * Production-Ready Attendance System Database Schema
 * 
 * This schema creates all necessary tables for a secure, scalable attendance tracking system.
 * Features: Authentication, GPS tracking, role-based access, audit logs
 * 
 * Usage:
 * mysql -u root -p < database/schema.sql
 */

-- Create database
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Drop existing tables (for fresh installation)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS attendance_locations;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS sessions;

-- ========================================
-- ROLES TABLE - Role Based Access Control
-- ========================================
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- EMPLOYEES TABLE - Employee Information
-- ========================================
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE,
  status ENUM('active', 'inactive', 'leave') DEFAULT 'active',
  allowed_location_radius DECIMAL(10, 2) DEFAULT 500,
  allowed_latitude DECIMAL(10, 8),
  allowed_longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- USERS TABLE - Authentication & Login
-- ========================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL DEFAULT 2,
  is_active TINYINT DEFAULT 1,
  last_login DATETIME,
  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) 
    REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE RESTRICT,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- ATTENDANCE TABLE - Check-in/out Records
-- ========================================
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  check_in DATETIME NOT NULL,
  check_out DATETIME,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  working_hours DECIMAL(5, 2),
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  is_late TINYINT DEFAULT 0,
  is_locked TINYINT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) 
    REFERENCES employees(id) ON DELETE CASCADE,
  
  INDEX idx_employee_id (employee_id),
  INDEX idx_check_in (check_in),
  INDEX idx_employee_check_in (employee_id, check_in),
  INDEX idx_is_locked (is_locked)
  -- Duplicate open sessions are prevented at the application layer
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- ATTENDANCE LOCATIONS TABLE - Location History
-- ========================================
CREATE TABLE attendance_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attendance_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  event_type ENUM('check_in', 'check_out') NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_locations_attendance FOREIGN KEY (attendance_id) 
    REFERENCES attendance(id) ON DELETE CASCADE,
  
  INDEX idx_attendance_id (attendance_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- AUDIT LOGS TABLE - Data Integrity & Security
-- ========================================
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INSERT DEFAULT ROLES
-- ========================================
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator - Full access'),
('employee', 'Employee - Can check-in/out and view own records');

-- ========================================
-- INSERT SAMPLE EMPLOYEES
-- ========================================
INSERT INTO employees (name, email, department, position, hire_date, allowed_latitude, allowed_longitude, allowed_location_radius) VALUES
('System Admin', 'admin@company.com', 'IT', 'System Administrator', '2020-01-01', 25.2048, 55.2708, 500),
('John Doe', 'john.doe@company.com', 'Engineering', 'Senior Developer', '2022-01-15', 25.2048, 55.2708, 500),
('Jane Smith', 'jane.smith@company.com', 'Engineering', 'Developer', '2022-06-01', 25.2048, 55.2708, 500),
('Robert Johnson', 'robert.johnson@company.com', 'Sales', 'Sales Manager', '2021-03-20', 25.2048, 55.2708, 500),
('Maria Garcia', 'maria.garcia@company.com', 'HR', 'HR Specialist', '2022-09-10', 25.2048, 55.2708, 500),
('Ahmed Hassan', 'ahmed.hassan@company.com', 'Operations', 'Operations Lead', '2020-11-05', 25.2048, 55.2708, 500),
('Sarah Williams', 'sarah.williams@company.com', 'Finance', 'Accountant', '2023-01-15', 25.2048, 55.2708, 500),
('Michael Brown', 'michael.brown@company.com', 'Engineering', 'QA Engineer', '2022-07-01', 25.2048, 55.2708, 500),
('Lisa Anderson', 'lisa.anderson@company.com', 'Marketing', 'Marketing Manager', '2021-05-12', 25.2048, 55.2708, 500);

-- ========================================
-- INSERT SAMPLE USERS
-- Passwords are set by running: node database/seed.js
-- This inserts placeholder rows only; seed.js sets real bcrypt hashes.
-- ========================================
-- Employee IDs shift by 1 because admin employee is now id=1.
-- Admin:    username=admin       password=Admin123
-- Employee: username=john.doe   password=Password123
INSERT INTO users (employee_id, username, email, password_hash, role_id, is_active) VALUES
(1, 'admin',          'admin@company.com',          'run_seed_script', 1, 1),
(2, 'john.doe',       'john.doe@company.com',       'run_seed_script', 2, 1),
(3, 'jane.smith',     'jane.smith@company.com',     'run_seed_script', 2, 1),
(4, 'robert.johnson', 'robert.johnson@company.com', 'run_seed_script', 2, 1),
(5, 'maria.garcia',   'maria.garcia@company.com',   'run_seed_script', 2, 1),
(6, 'ahmed.hassan',   'ahmed.hassan@company.com',   'run_seed_script', 2, 1),
(7, 'sarah.williams', 'sarah.williams@company.com', 'run_seed_script', 2, 1),
(8, 'michael.brown',  'michael.brown@company.com',  'run_seed_script', 2, 1),
(9, 'lisa.anderson',  'lisa.anderson@company.com',  'run_seed_script', 2, 1);
