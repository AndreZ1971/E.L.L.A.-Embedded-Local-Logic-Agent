-- Migration 002: Langzeitgedächtnis (ML-Ebene)
-- Embedding-basierte Erinnerungen für Nutzer, System und explizite Notizen

USE ella;

CREATE TABLE IF NOT EXISTS memories (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       ENUM('user', 'system', 'note') NOT NULL,
  content    TEXT         NOT NULL,
  embedding  MEDIUMTEXT   NOT NULL,
  source     VARCHAR(255),
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (type);
