-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS ai_resume_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_resume_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(20) DEFAULT 'free',
  ai_daily_count INT DEFAULT 0,
  ai_last_reset DATE NULL,
  role VARCHAR(20) DEFAULT 'user',
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
  custom_sections JSON NULL,
  version_history JSON NULL,
  template_id VARCHAR(50) DEFAULT 'modern',
  theme_color VARCHAR(20) DEFAULT '#2563eb',
  page_style VARCHAR(50) DEFAULT 'modern',
  ats_score INT DEFAULT 0,
  ats_feedback JSON NULL,
  is_public BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  share_slug VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Job Applications table (Tracker)
CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  company VARCHAR(150) NOT NULL,
  role VARCHAR(150) NOT NULL,
  location VARCHAR(100) NULL,
  salary VARCHAR(100) NULL,
  applied_date VARCHAR(50) NULL,
  status VARCHAR(50) DEFAULT 'Applied',
  notes TEXT NULL,
  resume_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_job (user_id)
);

-- Cover Letters table
CREATE TABLE IF NOT EXISTS cover_letters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  company_name VARCHAR(150) NOT NULL,
  job_role VARCHAR(150) NOT NULL,
  letter_content TEXT NOT NULL,
  tone VARCHAR(50) DEFAULT 'professional',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_letter (user_id)
);

-- Payments and Invoices table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  gateway VARCHAR(50) DEFAULT 'razorpay',
  order_id VARCHAR(100) NULL,
  payment_id VARCHAR(100) NULL,
  amount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  plan VARCHAR(50) DEFAULT 'pro_monthly',
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_payment (user_id)
);
