-- Add dispute_resolved status to task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'dispute_resolved';

-- Track who the dispute was resolved in favor of
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dispute_resolved_in_favor_of VARCHAR(10) DEFAULT NULL;
-- Values: 'buyer' or 'seller'
