-- Replace plaintext UUID api_key with hashed api_key_hash
-- API keys are now SHA-256 hashed before storage

-- Add new hash column
ALTER TABLE users ADD COLUMN api_key_hash VARCHAR(64);

-- Clear api_key for non-agent users (C09: only agents should have keys)
UPDATE users SET api_key = NULL WHERE is_agent = false;

-- Hash existing agent API keys using pgcrypto
-- NOTE: Existing keys will need to be rotated since we can't recover them from hashes
-- For the migration, we hash existing keys so they still work
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE users SET api_key_hash = encode(digest(api_key::text, 'sha256'), 'hex') WHERE api_key IS NOT NULL;

-- Create index on hash for fast lookups
CREATE UNIQUE INDEX idx_users_api_key_hash ON users(api_key_hash) WHERE api_key_hash IS NOT NULL;

-- Remove the old plaintext column and its index
ALTER TABLE users DROP COLUMN api_key;

-- Change default: no api_key generated for new users (handled in application code)
