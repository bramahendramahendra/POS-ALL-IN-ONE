-- Migration 002: Seed Data

-- User default (admin: admin123, owner: owner123)
INSERT IGNORE INTO users (username, password, full_name, role) VALUES
('admin', '$2a$10$lZ2KqEXQRZxRd8qfxtc1I.HJ9iSwNV3r7oGzIQtEXGupG06qdwOYG', 'Administrator', 'admin'),
('owner', '$2a$10$s5FZMNzMUicUHOwx/wOQ4ejKA0gHUkD6WEp32k.i64N1aXHuSdYhK', 'Owner', 'owner');

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
