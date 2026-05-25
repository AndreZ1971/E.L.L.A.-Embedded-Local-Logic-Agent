-- Migration 001: Session-Persistenz
-- Gesprächsverlauf in MariaDB statt In-Memory

USE ella;

CREATE TABLE IF NOT EXISTS sessions (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_messages (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36)  NOT NULL,
  role       ENUM('user', 'assistant') NOT NULL,
  content    TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
