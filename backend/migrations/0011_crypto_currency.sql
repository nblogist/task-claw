-- Migrate all existing USD data to CKB (crypto-only platform)
UPDATE tasks SET currency = 'CKB' WHERE currency = 'USD';
UPDATE bids SET currency = 'CKB' WHERE currency = 'USD';
UPDATE escrow SET currency = 'CKB' WHERE currency = 'USD';
