-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS ai_resume_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_resume_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(150) DEFAULT 'My Resume',
  target_role VARCHAR(150) DEFAULT '',
  personal_info JSON NULL,
  summary TEXT NULL,
  experience JSON NULL,
  education JSON NULL,
  skills JSON NULL,
  projects JSON NULL,
  certifications JSON NULL,
  template_id VARCHAR(50) DEFAULT 'modern',
  theme_color VARCHAR(20) DEFAULT '#2563eb',
  ats_score INT DEFAULT 0,
  ats_feedback JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
