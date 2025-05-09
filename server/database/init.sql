-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS portfolio;
USE portfolio;

-- Create messages table
CREATE TABLE IF NOT EXISTS Messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_email ON Messages(email);
CREATE INDEX idx_created_at ON Messages(createdAt);
