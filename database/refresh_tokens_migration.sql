-- ─────────────────────────────────────────────────────────────────────────────
-- Refresh token store: run once against the live database.
-- Each row represents one issued refresh token.
-- Rotation: old row is revoked, new row inserted on every /api/auth/refresh call.
-- Reuse detection: if a revoked token arrives, ALL tokens for that user are
--   revoked (indicates possible theft of a previously-valid token).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT           NOT NULL AUTO_INCREMENT,
  user_id     INT           NOT NULL,
  token_hash  VARCHAR(64)   NOT NULL,            -- SHA-256 hex of the raw JWT
  expires_at  DATETIME      NOT NULL,
  revoked     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_token_hash (token_hash),        -- fast revocation lookup
  INDEX       idx_user_id   (user_id),
  INDEX       idx_expires   (expires_at),        -- for periodic cleanup queries

  CONSTRAINT fk_rt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: periodic cleanup of old revoked/expired rows (run as a cron job)
-- DELETE FROM refresh_tokens
--   WHERE revoked = 1 OR expires_at < NOW() - INTERVAL 1 DAY;
