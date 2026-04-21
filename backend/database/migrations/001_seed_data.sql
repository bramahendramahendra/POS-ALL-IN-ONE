-- =============================================================
-- Seed Data 001 — Data Awal
-- Project  : POS Multi-Platform
-- Catatan  : Jalankan setelah 001_init_schema.sql
-- =============================================================

-- -------------------------------------------------------------
-- Users default
-- password 'admin123' dan 'owner123' — ganti hash sebelum produksi
-- Gunakan: SELECT PASSWORD('admin123') atau generate via aplikasi
-- -------------------------------------------------------------
INSERT INTO `users` (`username`, `password`, `full_name`, `role`) VALUES
('admin', '$2a$10$PLACEHOLDER_HASH_ADMIN123_REPLACE_ME_BEFORE_PROD', 'Administrator', 'admin'),
('owner', '$2a$10$PLACEHOLDER_HASH_OWNER123_REPLACE_ME_BEFORE_PROD', 'Owner',         'owner');

-- -------------------------------------------------------------
-- Satuan default
-- -------------------------------------------------------------
INSERT INTO `units` (`name`, `abbreviation`) VALUES
('Pcs',    'pcs'),
('Box',    'box'),
('Pack',   'pack'),
('Botol',  'btl'),
('Kg',     'kg'),
('Gram',   'gr'),
('Liter',  'ltr'),
('Lusin',  'lsn'),
('Karton', 'ktn');

-- -------------------------------------------------------------
-- Settings default
-- -------------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('store_name',                 'Toko Retail'),
('store_address',              ''),
('store_phone',                ''),
('store_email',                ''),
('tax_enabled',                '0'),
('tax_percent',                '11'),
('receipt_footer',             'Terima kasih telah berbelanja'),
('stock_notification_enabled', '1');
