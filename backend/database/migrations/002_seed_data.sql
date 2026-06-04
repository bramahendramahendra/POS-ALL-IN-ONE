-- =============================================================
-- Migration 002: Seed Data — POS Retail
-- Data awal yang diperlukan agar aplikasi bisa berjalan.
-- Gunakan INSERT IGNORE agar aman jika dijalankan ulang.
-- =============================================================

-- -------------------------------------------------------------
-- Payment Statuses
-- -------------------------------------------------------------
INSERT IGNORE INTO payment_statuses (code, label, is_active, sort_order) VALUES
    ('unpaid',  'Hutang',         1, 1),
    ('partial', 'Bayar Sebagian', 1, 2),
    ('paid',    'Lunas',          1, 3);

-- -------------------------------------------------------------
-- Payment Methods
-- -------------------------------------------------------------
INSERT IGNORE INTO payment_methods (code, label, is_active, sort_order) VALUES
    ('cash',     'Tunai',         1, 1),
    ('transfer', 'Transfer Bank', 1, 2),
    ('card',     'Kartu',         1, 3),
    ('qris',     'QRIS',          1, 4),
    ('kredit',   'Kredit',        1, 5);

-- -------------------------------------------------------------
-- Roles (3 role sistem, tidak bisa dihapus)
-- -------------------------------------------------------------
INSERT IGNORE INTO roles (name, display_name, description, is_system, is_active) VALUES
    ('owner', 'Owner', 'Akses penuh ke seluruh sistem',             1, 1),
    ('admin', 'Admin', 'Akses manajemen tanpa pengaturan sistem',    1, 1),
    ('kasir', 'Kasir', 'Akses terbatas hanya untuk transaksi kasir', 1, 1);

-- -------------------------------------------------------------
-- Users default
-- password: admin → 'admin123' | owner → 'owner123'
-- Ganti hash sebelum deploy ke production.
-- -------------------------------------------------------------
INSERT IGNORE INTO users (username, password, full_name, role_id)
SELECT 'owner', '$argon2id$v=19$m=65536,t=3,p=4$gcWNYu+y/FCRuCT6WS/+eg$1qAjwCU3HoK87s/CbDPHYo06W6B4mhoHF1SQmkigukY', 'Owner', id
FROM roles WHERE name = 'owner';

INSERT IGNORE INTO users (username, password, full_name, role_id)
SELECT 'admin', '$argon2id$v=19$m=65536,t=3,p=4$TJxWkwEYoSuvSZ0JtwrfJw$ne9pID5QjltGeu0cNxiKYGCOXkUCRRjunQUYvttxCsM', 'Administrator', id
FROM roles WHERE name = 'admin';

-- -------------------------------------------------------------
-- Pengaturan default toko
-- -------------------------------------------------------------
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
    ('store_name',                 'Toko Retail'),
    ('store_address',              ''),
    ('store_phone',                ''),
    ('store_email',                ''),
    ('tax_enabled',                '0'),
    ('tax_percent',                '11'),
    ('receipt_footer',             'Terima kasih telah berbelanja'),
    ('stock_notification_enabled', '1');

-- -------------------------------------------------------------
-- Menus — mengikuti struktur navigasi web-v2
-- Urutan insert: parent dulu, baru children
-- -------------------------------------------------------------

-- Group: Beranda
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('beranda', 'Beranda', 'Home', NULL, 1);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'beranda.dashboard', 'Dashboard', 'LayoutDashboard', '/dashboard', 1
FROM menus m WHERE m.key_name = 'beranda';

-- Group: Penjualan
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('penjualan', 'Penjualan', 'ShoppingCart', NULL, 2);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'penjualan.kasir', 'Kasir', 'ShoppingCart', '/kasir', 1
FROM menus m WHERE m.key_name = 'penjualan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'penjualan.transaksi', 'Transaksi', 'Receipt', '/transactions', 2
FROM menus m WHERE m.key_name = 'penjualan';

-- Group: Produk
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('produk', 'Produk', 'Package', NULL, 3);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'produk.produk', 'Produk', 'Package', '/products', 1
FROM menus m WHERE m.key_name = 'produk';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'produk.kategori', 'Kategori', 'Tag', '/products/categories', 2
FROM menus m WHERE m.key_name = 'produk';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'produk.unit', 'Unit', 'PackageSearch', '/products/units', 3
FROM menus m WHERE m.key_name = 'produk';

-- Group: Pengadaan
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('pengadaan', 'Pengadaan', 'Truck', NULL, 4);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pengadaan.supplier', 'Supplier', 'Truck', '/suppliers', 1
FROM menus m WHERE m.key_name = 'pengadaan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pengadaan.pembelian', 'Pembelian', 'ShoppingBag', '/suppliers/purchases', 2
FROM menus m WHERE m.key_name = 'pengadaan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pengadaan.retur', 'Retur', 'RotateCcw', '/suppliers/returns', 3
FROM menus m WHERE m.key_name = 'pengadaan';

-- Group: Pelanggan
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('pelanggan', 'Pelanggan', 'Users', NULL, 5);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pelanggan.pelanggan', 'Pelanggan', 'Users', '/customers', 1
FROM menus m WHERE m.key_name = 'pelanggan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pelanggan.piutang', 'Piutang', 'CreditCard', '/receivables', 2
FROM menus m WHERE m.key_name = 'pelanggan';

-- Group: Keuangan
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('keuangan', 'Keuangan', 'Wallet', NULL, 6);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'keuangan.dashboard', 'Dashboard Keuangan', 'Wallet', '/finance', 1
FROM menus m WHERE m.key_name = 'keuangan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'keuangan.kas_harian', 'Kas Harian', 'Landmark', '/finance/cash-drawer', 2
FROM menus m WHERE m.key_name = 'keuangan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'keuangan.rekap_kas', 'Rekap Kas', 'BookOpen', '/finance/cash-drawer/rekap', 3
FROM menus m WHERE m.key_name = 'keuangan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'keuangan.pengeluaran', 'Pengeluaran', 'TrendingDown', '/finance/expenses', 4
FROM menus m WHERE m.key_name = 'keuangan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'keuangan.kas_saya', 'Kas Saya', 'Wallet', '/finance/my-cash', 5
FROM menus m WHERE m.key_name = 'keuangan';

-- Group: Pelaporan
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('pelaporan', 'Pelaporan', 'BarChart2', NULL, 7);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pelaporan.penjualan', 'Penjualan', 'TrendingUp', '/reports/sales', 1
FROM menus m WHERE m.key_name = 'pelaporan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pelaporan.laba_rugi', 'Laba Rugi', 'LineChart', '/reports/profit-loss', 2
FROM menus m WHERE m.key_name = 'pelaporan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pelaporan.stok', 'Stok', 'PackageSearch', '/reports/stock', 3
FROM menus m WHERE m.key_name = 'pelaporan';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'pelaporan.kinerja_kasir', 'Kinerja Kasir', 'BarChart2', '/reports/cashier', 4
FROM menus m WHERE m.key_name = 'pelaporan';

-- Group: Operasional
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('operasional', 'Operasional', 'Clock', NULL, 8);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'operasional.shift', 'Shift', 'Clock', '/shifts', 1
FROM menus m WHERE m.key_name = 'operasional';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'operasional.sync', 'Sync Center', 'RefreshCw', '/sync', 2
FROM menus m WHERE m.key_name = 'operasional';

-- Group: Sistem
INSERT IGNORE INTO menus (key_name, label, icon, path, order_index) VALUES
    ('sistem', 'Sistem', 'Settings', NULL, 9);

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'sistem.profil_toko', 'Profil Toko', 'Settings', '/settings/store', 1
FROM menus m WHERE m.key_name = 'sistem';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'sistem.users', 'Manajemen User', 'Users', '/settings/users', 2
FROM menus m WHERE m.key_name = 'sistem';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'sistem.roles', 'Manajemen Role', 'Shield', '/settings/roles', 3
FROM menus m WHERE m.key_name = 'sistem';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'sistem.menus', 'Manajemen Menu', 'LayoutList', '/settings/menus', 4
FROM menus m WHERE m.key_name = 'sistem';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'sistem.printer', 'Printer', 'Printer', '/settings/printer', 5
FROM menus m WHERE m.key_name = 'sistem';

INSERT IGNORE INTO menus (parent_id, key_name, label, icon, path, order_index)
SELECT m.id, 'sistem.versi', 'Versi Aplikasi', 'RefreshCw', '/settings/versions', 6
FROM menus m WHERE m.key_name = 'sistem';

-- -------------------------------------------------------------
-- Role Menu Access
-- Owner  : akses penuh semua menu
-- Admin  : semua menu kecuali sistem.users (owner only),
--          sistem.roles & sistem.menus & sistem.versi (view only)
-- Kasir  : hanya penjualan.kasir dan keuangan.kas_saya
-- -------------------------------------------------------------

-- OWNER: full access semua menu
INSERT IGNORE INTO role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r, menus m
WHERE r.name = 'owner';

-- ADMIN: akses penuh semua menu kecuali yang owner-only
INSERT IGNORE INTO role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.id, 1, 1, 1, 0
FROM roles r
JOIN menus m ON m.key_name NOT IN ('sistem.roles', 'sistem.menus', 'sistem.users', 'sistem.versi')
WHERE r.name = 'admin';

-- ADMIN: sistem.roles, sistem.menus, sistem.versi — view only
INSERT IGNORE INTO role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.id, 1, 0, 0, 0
FROM roles r
JOIN menus m ON m.key_name IN ('sistem.roles', 'sistem.menus', 'sistem.versi')
WHERE r.name = 'admin';

-- KASIR: hanya kasir dan kas saya
INSERT IGNORE INTO role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.id, 1, 1, 0, 0
FROM roles r
JOIN menus m ON m.key_name IN ('penjualan.kasir', 'keuangan.kas_saya')
WHERE r.name = 'kasir';
