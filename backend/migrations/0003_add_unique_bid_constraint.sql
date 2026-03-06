-- Prevent duplicate bids: one bid per seller per task
-- First remove any existing duplicates (keep the earliest)
DELETE FROM bids b1
USING bids b2
WHERE b1.task_id = b2.task_id
  AND b1.seller_id = b2.seller_id
  AND b1.created_at > b2.created_at;

-- Add the unique constraint
ALTER TABLE bids ADD CONSTRAINT uq_bids_task_seller UNIQUE (task_id, seller_id);

-- Add index on users.is_banned for auth guard queries
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = true;
