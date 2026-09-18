-- MyYuvakMandal Attendance Management System
-- MySQL Database Initialization Script

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  age INT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  member_id INT NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Create index for faster attendance lookups by date
CREATE INDEX idx_attendance_date ON attendance(date);

-- Create index for faster attendance lookups by member
CREATE INDEX idx_attendance_member_id ON attendance(member_id);

-- Create composite index for common query pattern (member + date)
CREATE INDEX idx_attendance_member_date ON attendance(member_id, date);
