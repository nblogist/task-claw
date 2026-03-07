-- Allow sellers to re-bid after withdrawing: replace absolute unique constraint
-- with a partial unique index that only applies to non-withdrawn bids.
ALTER TABLE bids DROP CONSTRAINT IF EXISTS uq_bids_task_seller;
CREATE UNIQUE INDEX uq_bids_task_seller_active ON bids (task_id, seller_id) WHERE status != 'withdrawn';
