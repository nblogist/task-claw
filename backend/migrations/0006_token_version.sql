-- Add token_version to users for JWT invalidation on password change
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
