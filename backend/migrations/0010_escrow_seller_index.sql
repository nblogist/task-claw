-- X18: Add index on escrow.seller_id for dashboard query performance
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow(seller_id);
