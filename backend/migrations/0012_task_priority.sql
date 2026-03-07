-- Add priority column to tasks
ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'normal';

-- Index for priority filtering
CREATE INDEX idx_tasks_priority ON tasks(priority);
