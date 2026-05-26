ALTER TABLE purchase_payments ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'tunai' AFTER amount;
