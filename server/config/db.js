import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;
let isConnected = false;

// Create pool and initialize database
export async function initDB() {
  try {
    // First connect without specifying DB to ensure DB exists
    const rootConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT) || 3306
    });

    const dbName = process.env.DB_NAME || 'ai_resume_db';
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConnection.end();

    // Now create pool with the database
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 1. Users table
    await pool.query(`
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
      ) ENGINE=InnoDB;
    `);

    // Add columns to users if missing
    try { await pool.query(`ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT 'free';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN ai_daily_count INT DEFAULT 0;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN ai_last_reset DATE NULL;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';`); } catch (e) {}

    // 2. Resumes table
    await pool.query(`
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
        ats_score INT DEFAULT 0,
        ats_feedback JSON NULL,
        is_public BOOLEAN DEFAULT TRUE,
        view_count INT DEFAULT 0,
        share_slug VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB;
    `);

    // Add columns to resumes if missing
    try { await pool.query(`ALTER TABLE resumes ADD COLUMN custom_sections JSON NULL;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE resumes ADD COLUMN version_history JSON NULL;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE resumes ADD COLUMN is_public BOOLEAN DEFAULT TRUE;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE resumes ADD COLUMN view_count INT DEFAULT 0;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE resumes ADD COLUMN share_slug VARCHAR(100) NULL;`); } catch (e) {}

    // 3. Job Applications table (Tracker)
    await pool.query(`
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
      ) ENGINE=InnoDB;
    `);

    // 4. Cover Letters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cover_letters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        company_name VARCHAR(150) NOT NULL,
        job_role VARCHAR(150) NOT NULL,
        letter_content TEXT NOT NULL,
        tone VARCHAR(50) DEFAULT 'professional',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_letter (user_id)
      ) ENGINE=InnoDB;
    `);

    // 5. Payments table
    await pool.query(`
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
      ) ENGINE=InnoDB;
    `);

    isConnected = true;
    console.log(`✅ MySQL Connected successfully to database: ${dbName}`);
  } catch (error) {
    console.warn(`⚠️ MySQL Connection Warning: ${error.message}`);
    console.warn(`👉 Check server/.env to ensure your DB_USER and DB_PASSWORD match your local MySQL Server 8.0 configuration.`);
  }
}

export function getDB() {
  return pool;
}

export function getIsConnected() {
  return isConnected;
}
