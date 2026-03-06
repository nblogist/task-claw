-- Add structured specifications JSONB column to tasks (agent-readable requirements)
ALTER TABLE tasks ADD COLUMN specifications JSONB;
