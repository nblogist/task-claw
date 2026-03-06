-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    bio             TEXT,
    is_agent        BOOLEAN NOT NULL DEFAULT FALSE,
    agent_type      VARCHAR(50),
    api_key         UUID UNIQUE DEFAULT gen_random_uuid(),
    avg_rating      NUMERIC(3,2),
    total_ratings   INTEGER NOT NULL DEFAULT 0,
    tasks_posted    INTEGER NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    spend_limit_per_task    NUMERIC(18,8),
    spend_limit_per_day     NUMERIC(18,8),
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
    'open', 'bidding', 'in_escrow', 'delivered',
    'completed', 'disputed', 'cancelled', 'expired'
);

-- Tasks table
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(160) NOT NULL UNIQUE,
    buyer_id        UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(120) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(80) NOT NULL,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    budget_min      NUMERIC(18,8) NOT NULL,
    budget_max      NUMERIC(18,8) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
    deadline        TIMESTAMPTZ NOT NULL,
    status          task_status NOT NULL DEFAULT 'open',
    accepted_bid_id UUID,
    view_count      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_buyer ON tasks(buyer_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Bid status enum
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Bids table
CREATE TABLE bids (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id                 UUID NOT NULL REFERENCES tasks(id),
    seller_id               UUID NOT NULL REFERENCES users(id),
    price                   NUMERIC(18,8) NOT NULL,
    currency                VARCHAR(10) NOT NULL,
    estimated_delivery_days INTEGER NOT NULL,
    pitch                   VARCHAR(500) NOT NULL,
    status                  bid_status NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bids_task ON bids(task_id);
CREATE INDEX idx_bids_seller ON bids(seller_id);

-- Escrow status enum
CREATE TYPE escrow_status AS ENUM ('locked', 'released', 'refunded', 'disputed');

-- Escrow table
CREATE TABLE escrow (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL UNIQUE REFERENCES tasks(id),
    bid_id      UUID NOT NULL REFERENCES bids(id),
    buyer_id    UUID NOT NULL REFERENCES users(id),
    seller_id   UUID NOT NULL REFERENCES users(id),
    amount      NUMERIC(18,8) NOT NULL,
    currency    VARCHAR(10) NOT NULL,
    status      escrow_status NOT NULL DEFAULT 'locked',
    locked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at TIMESTAMPTZ,
    tx_hash     TEXT
);

-- Deliveries table
CREATE TABLE deliveries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES tasks(id),
    seller_id   UUID NOT NULL REFERENCES users(id),
    message     TEXT NOT NULL,
    url         TEXT,
    file_url    TEXT,
    revision_of UUID REFERENCES deliveries(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dispute resolution enum
CREATE TYPE dispute_resolution AS ENUM ('buyer', 'seller', 'split');

-- Disputes table
CREATE TABLE disputes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL UNIQUE REFERENCES tasks(id),
    raised_by   UUID NOT NULL REFERENCES users(id),
    reason      TEXT NOT NULL,
    resolution  dispute_resolution,
    admin_note  TEXT,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ratings table
CREATE TABLE ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES tasks(id),
    rater_id    UUID NOT NULL REFERENCES users(id),
    ratee_id    UUID NOT NULL REFERENCES users(id),
    score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(task_id, rater_id)
);
