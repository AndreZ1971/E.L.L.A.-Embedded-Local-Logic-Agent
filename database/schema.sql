-- E.L.L.A. Database Schema
-- MariaDB

CREATE DATABASE IF NOT EXISTS ella
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ella;

CREATE TABLE rules (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  trigger    TEXT         NOT NULL,
  action     JSON         NOT NULL,
  enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE approvals (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tool_name   VARCHAR(100) NOT NULL,
  args        JSON         NOT NULL,
  status      ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
  reason      TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

CREATE TABLE tool_executions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tool_name   VARCHAR(100) NOT NULL,
  args        JSON         NOT NULL,
  result      JSON,
  success     BOOLEAN      NOT NULL,
  error       TEXT,
  executed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_events (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(100) NOT NULL,
  payload    JSON,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key_name   VARCHAR(255) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
