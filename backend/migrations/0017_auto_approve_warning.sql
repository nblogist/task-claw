-- Add auto_approve_warning notification kind for 48-hour delivery warning
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'auto_approve_warning';
