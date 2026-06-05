-- E.L.L.A. Database Schema
-- MariaDB — idempotent, alle Statements IF NOT EXISTS

CREATE DATABASE IF NOT EXISTS ella
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ella;

CREATE TABLE IF NOT EXISTS sessions (
  id         VARCHAR(255) PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  role       ENUM('user', 'assistant') NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memories (
  id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       ENUM('user', 'system', 'note') NOT NULL,
  content    TEXT NOT NULL,
  embedding  MEDIUMTEXT NOT NULL,
  source     VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (type);
CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages (session_id);

-- tool_name: '*' = gilt für alle Tools, sonst spezifischer Tool-Name
-- trigger:   'always' | 'disk_c > 85' | 'hour > 22' | 'hour < 8'
-- action:    Evaluation-Reihenfolge: deny-Regeln werden vor allow-Regeln geprüft
CREATE TABLE IF NOT EXISTS rules (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  tool_name  VARCHAR(100) NOT NULL DEFAULT '*',
  `trigger`  VARCHAR(255) NOT NULL DEFAULT 'always',
  action     ENUM('allow', 'deny') NOT NULL DEFAULT 'allow',
  enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_executions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tool_name   VARCHAR(100) NOT NULL,
  args        JSON         NOT NULL,
  result      JSON,
  success     BOOLEAN      NOT NULL,
  error       TEXT,
  executed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_events (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(100) NOT NULL,
  payload    JSON,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key_name   VARCHAR(255) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- v3.1.0 ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  NOT NULL DEFAULT '#7c3aed',
  pin_hash   VARCHAR(60)  NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT          NULL,
  title      VARCHAR(500) NOT NULL,
  status     ENUM('pending','done','cancelled') NOT NULL DEFAULT 'pending',
  priority   ENUM('low','normal','high')        NOT NULL DEFAULT 'normal',
  due_date   DATETIME NULL,
  note       TEXT     NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_status  (status),
  INDEX idx_tasks_profile (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_feedback (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  profile_id      INT          NULL,
  session_id      VARCHAR(255) NULL,
  tool_name       VARCHAR(100) NULL,
  message_excerpt TEXT         NOT NULL,
  feedback        ENUM('positive','negative') NOT NULL,
  category        VARCHAR(100) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feedback_type    (feedback),
  INDEX idx_feedback_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
