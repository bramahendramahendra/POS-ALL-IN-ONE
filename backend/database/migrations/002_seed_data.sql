-- Migration 002: Seed Data

-- User default (admin: admin123, owner: owner123)
INSERT IGNORE INTO users (username, password, full_name, role) VALUES
('admin', '$argon2id$v=19$m=65536,t=3,p=4$TJxWkwEYoSuvSZ0JtwrfJw$ne9pID5QjltGeu0cNxiKYGCOXkUCRRjunQUYvttxCsM', 'Administrator', 'admin'),
('owner', '$argon2id$v=19$m=65536,t=3,p=4$gcWNYu+y/FCRuCT6WS/+eg$1qAjwCU3HoK87s/CbDPHYo06W6B4mhoHF1SQmkigukY', 'Owner', 'owner');

-- Satuan default
INSERT IGNORE INTO units (name, abbreviation) VALUES
('Pcs', 'pcs'),
('Box', 'box'),
('Pack', 'pack'),
('Botol', 'btl'),
('Kg', 'kg'),
('Gram', 'gr'),
('Liter', 'ltr'),
('Lusin', 'lsn'),
('Karton', 'ktn');

-- Settings default
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('store_name', 'Toko Retail'),
('store_address', ''),
('store_phone', ''),
('store_email', ''),
('tax_enabled', '0'),
('tax_percent', '11'),
('receipt_footer', 'Terima kasih telah berbelanja'),
('stock_notification_enabled', '1');
