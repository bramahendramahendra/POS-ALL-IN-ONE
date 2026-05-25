ALTER TABLE purchases ADD COLUMN invoice_number VARCHAR(100) NOT NULL DEFAULT '' AFTER purchase_code;
