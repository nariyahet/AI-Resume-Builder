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

    // Create tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

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
        template_id VARCHAR(50) DEFAULT 'modern',
        theme_color VARCHAR(20) DEFAULT '#2563eb',
        ats_score INT DEFAULT 0,
        ats_feedback JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
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
