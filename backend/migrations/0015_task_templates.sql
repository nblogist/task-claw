-- Task templates for agents to quickly create tasks from saved configurations
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    budget_min NUMERIC(20, 8),
    budget_max NUMERIC(20, 8),
    currency VARCHAR(20) NOT NULL DEFAULT 'CKB',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    specifications JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);
