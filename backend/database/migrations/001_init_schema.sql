-- =============================================================
-- Migration 001: Initial Schema — POS Retail
-- Schema lengkap final. Semua tabel, kolom, index, dan constraint
-- sudah dalam kondisi terbaru. Tidak ada ALTER TABLE terpisah.
-- =============================================================

-- -------------------------------------------------------------
-- Auth
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)   UNIQUE NOT NULL,
    password   VARCHAR(255)  NOT NULL,
    full_name  VARCHAR(100)  NOT NULL,
    role_id    INT           NULL,
    pin_hash   VARCHAR(255)  NULL,
    is_active  TINYINT(1)    DEFAULT 1,
    created_at DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- user_role disimpan sebagai VARCHAR agar token tidak perlu decode untuk cek role
CREATE TABLE IF NOT EXISTS sessions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    user_role     VARCHAR(20)  NOT NULL DEFAULT 'kasir',
    token         TEXT         NOT NULL,
    refresh_token TEXT         NOT NULL,
    device_info   VARCHAR(100) NULL,
    ip_address    VARCHAR(50)  NULL,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME     NOT NULL,
    UNIQUE KEY unique_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- RBAC — Roles, Menus, Role Menu Access
-- -------------------------------------------------------------

-- is_system = 1 artinya role bawaan sistem, tidak bisa dihapus
CREATE TABLE IF NOT EXISTS roles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50)  UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description  VARCHAR(255) NULL,
    is_system    TINYINT(1)   DEFAULT 0,
    is_active    TINYINT(1)   DEFAULT 1,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menus (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    parent_id   INT          NULL,
    key_name    VARCHAR(100) UNIQUE NOT NULL,
    label       VARCHAR(100) NOT NULL,
    icon        VARCHAR(100) NULL,
    path        VARCHAR(200) NULL,
    order_index INT          DEFAULT 0,
    is_active   TINYINT(1)   DEFAULT 1,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_menu_access (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    role_id    INT        NOT NULL,
    menu_id    INT        NOT NULL,
    can_view   TINYINT(1) DEFAULT 1,
    can_create TINYINT(1) DEFAULT 0,
    can_edit   TINYINT(1) DEFAULT 0,
    can_delete TINYINT(1) DEFAULT 0,
    created_at DATETIME   DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_menu (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(id)  ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(id)  ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- FK users.role_id → roles
ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id);

-- -------------------------------------------------------------
-- Master Data
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(10)  NULL UNIQUE,
    description TEXT         NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS units (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    is_active    TINYINT(1)  DEFAULT 1,
    created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    setting_key   VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT         NULL,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Produk
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    barcode        VARCHAR(100)  UNIQUE NULL,
    sku            VARCHAR(50)   NULL UNIQUE,
    name           VARCHAR(200)  NOT NULL,
    category_id    INT           NULL,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    selling_price  DECIMAL(15,2) DEFAULT 0,
    stock          DECIMAL(15,3) DEFAULT 0,
    min_stock      DECIMAL(15,3) DEFAULT 0,
    unit_id        INT           NULL,
    is_active      TINYINT(1)    DEFAULT 1,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (unit_id)     REFERENCES units(id)      ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

-- product_packages: varian satuan jual produk (grosir, konversi, dll)
-- unit_id       : FK ke master units (wajib, NOT NULL)
-- package_name  : label deskriptif opsional, misal "1 Dus", "3 Botol"
-- conversion_qty: kelipatan konversi ke satuan dasar (is_default=true selalu = 1)
-- is_default=1  : paket satuan dasar produk
CREATE TABLE IF NOT EXISTS product_packages (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT           NOT NULL,
    unit_id        INT           NOT NULL,
    package_name   VARCHAR(100)  NULL,
    conversion_qty DECIMAL(15,3) NOT NULL DEFAULT 1,
    selling_price  DECIMAL(15,2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_default     TINYINT(1)    DEFAULT 0,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id)    REFERENCES units(id)    ON DELETE RESTRICT
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_prices (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT           NOT NULL,
    tier_name  VARCHAR(100)  NOT NULL,
    min_qty    DECIMAL(15,3) NOT NULL DEFAULT 1,
    price      DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Supplier & Pengadaan
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS suppliers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code  VARCHAR(50)  UNIQUE NOT NULL,
    name           VARCHAR(200) NOT NULL,
    address        TEXT         NULL,
    phone          VARCHAR(50)  NULL,
    email          VARCHAR(100) NULL,
    contact_person VARCHAR(100) NULL,
    notes          TEXT         NULL,
    is_active      TINYINT(1)   DEFAULT 1,
    created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_statuses (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    label      VARCHAR(50)  NOT NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_methods (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(30)  NOT NULL UNIQUE,
    label      VARCHAR(50)  NOT NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchases (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    purchase_code    VARCHAR(50)   UNIQUE NOT NULL,
    invoice_number   VARCHAR(100)  NOT NULL DEFAULT '',
    supplier_id      INT           NULL,
    purchase_date    DATE          NOT NULL,
    discount_amount  DECIMAL(15,2) DEFAULT 0,
    total_amount     DECIMAL(15,2) DEFAULT 0,
    payment_status   VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
    paid_amount      DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) DEFAULT 0,
    user_id          INT           NULL,
    notes            TEXT          NULL,
    created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id)    REFERENCES suppliers(id)         ON DELETE SET NULL,
    FOREIGN KEY (user_id)        REFERENCES users(id)             ON DELETE SET NULL,
    FOREIGN KEY (payment_status) REFERENCES payment_statuses(code)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id    INT           NOT NULL,
    product_id     INT           NULL,
    quantity       DECIMAL(15,3) NOT NULL,
    unit           VARCHAR(50)   NOT NULL,
    conversion_qty DECIMAL(15,3) NOT NULL DEFAULT 1,
    purchase_price DECIMAL(15,2) NOT NULL,
    subtotal       DECIMAL(15,2) NOT NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_payments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id    INT           NOT NULL,
    payment_date   DATE          NOT NULL,
    amount         DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(30)   NOT NULL DEFAULT 'cash',
    notes          TEXT          NULL,
    user_id        INT           NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id)    REFERENCES purchases(id)        ON DELETE CASCADE,
    FOREIGN KEY (user_id)        REFERENCES users(id)            ON DELETE SET NULL,
    FOREIGN KEY (payment_method) REFERENCES payment_methods(code)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS supplier_returns (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    return_code         VARCHAR(50)                           UNIQUE NOT NULL,
    purchase_id         INT                                   NOT NULL,
    supplier_id         INT                                   NULL,
    supplier_name       VARCHAR(200)                          NOT NULL,
    return_date         DATE                                  NOT NULL,
    total_return_amount DECIMAL(15,2)                         DEFAULT 0,
    reason              TEXT                                  NOT NULL,
    status              ENUM('pending','approved','rejected') DEFAULT 'pending',
    user_id             INT                                   NOT NULL,
    notes               TEXT                                  NULL,
    created_at          DATETIME                              DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME                              DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)  ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)  ON DELETE SET NULL,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE RESTRICT
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS supplier_return_items (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    return_id        INT           NOT NULL,
    purchase_item_id INT           NOT NULL,
    product_id       INT           NOT NULL,
    product_name     VARCHAR(200)  NOT NULL,
    quantity         DECIMAL(15,3) NOT NULL,
    unit             VARCHAR(50)   NOT NULL,
    purchase_price   DECIMAL(15,2) NOT NULL,
    subtotal         DECIMAL(15,2) NOT NULL,
    created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id)  REFERENCES supplier_returns(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE RESTRICT
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Pelanggan & Piutang
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50)   UNIQUE NOT NULL,
    name          VARCHAR(200)  NOT NULL,
    phone         VARCHAR(50)   NULL,
    address       TEXT          NULL,
    credit_limit  DECIMAL(15,2) DEFAULT 0,
    is_active     TINYINT(1)    DEFAULT 1,
    notes         TEXT          NULL,
    created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Penjualan
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shifts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    start_time TIME         NOT NULL,
    end_time   TIME         NOT NULL,
    is_active  TINYINT(1)   DEFAULT 1,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50)                        UNIQUE NOT NULL,
    user_id          INT                                NULL,
    shift_id         INT                                NULL,
    transaction_date DATETIME                           NOT NULL,
    subtotal         DECIMAL(15,2)                      DEFAULT 0,
    discount         DECIMAL(15,2)                      DEFAULT 0,
    tax              DECIMAL(15,2)                      DEFAULT 0,
    total_amount     DECIMAL(15,2)                      DEFAULT 0,
    payment_method   VARCHAR(30)                        NOT NULL DEFAULT 'cash',
    payment_amount   DECIMAL(15,2)                      DEFAULT 0,
    change_amount    DECIMAL(15,2)                      DEFAULT 0,
    customer_id      INT                                NULL,
    is_credit        TINYINT(1)                         DEFAULT 0,
    status           ENUM('pending','completed','void') DEFAULT 'completed',
    device_source    ENUM('desktop','web','android')    DEFAULT 'web',
    created_at       DATETIME                           DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME                           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)        REFERENCES users(id)            ON DELETE SET NULL,
    FOREIGN KEY (customer_id)    REFERENCES customers(id)        ON DELETE SET NULL,
    FOREIGN KEY (shift_id)       REFERENCES shifts(id)           ON DELETE SET NULL,
    FOREIGN KEY (payment_method) REFERENCES payment_methods(code)
) DEFAULT CHARSET=utf8mb4;

-- unit        : snapshot nama satuan saat transaksi (tidak berubah meski master unit diedit)
-- unit_id     : FK ke product_packages.id untuk traceability
-- conversion_qty: kelipatan konversi ke satuan dasar, dipakai hitung pengurangan stok
CREATE TABLE IF NOT EXISTS transaction_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT           NOT NULL,
    product_id     INT           NULL,
    product_name   VARCHAR(200)  NOT NULL,
    quantity       DECIMAL(15,3) NOT NULL,
    unit           VARCHAR(50)   NOT NULL,
    price          DECIMAL(15,2) NOT NULL,
    subtotal       DECIMAL(15,2) NOT NULL,
    discount_item  DECIMAL(15,2) DEFAULT 0,
    conversion_qty DECIMAL(15,3) DEFAULT 1,
    unit_id        INT           NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)     REFERENCES products(id)     ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS receivables (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id   INT                             NULL,
    customer_id      INT                             NULL,
    total_amount     DECIMAL(15,2)                   NOT NULL,
    paid_amount      DECIMAL(15,2)                   DEFAULT 0,
    remaining_amount DECIMAL(15,2)                   NOT NULL,
    status           ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    due_date         DATE                            NULL,
    notes            TEXT                            NULL,
    created_at       DATETIME                        DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME                        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id)    REFERENCES customers(id)    ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS receivable_payments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    receivable_id  INT           NOT NULL,
    payment_date   DATE          NOT NULL,
    amount         DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(30)   NOT NULL DEFAULT 'cash',
    notes          TEXT          NULL,
    user_id        INT           NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receivable_id)  REFERENCES receivables(id)      ON DELETE CASCADE,
    FOREIGN KEY (user_id)        REFERENCES users(id)             ON DELETE SET NULL,
    FOREIGN KEY (payment_method) REFERENCES payment_methods(code)
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Keuangan
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cash_drawer (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT           NULL,
    shift_id         INT           NULL,
    open_time        DATETIME      NOT NULL,
    close_time       DATETIME      NULL,
    opening_balance  DECIMAL(15,2) DEFAULT 0,
    closing_balance  DECIMAL(15,2) NULL,
    expected_balance DECIMAL(15,2) DEFAULT 0,
    difference       DECIMAL(15,2) DEFAULT 0,
    total_sales      DECIMAL(15,2) DEFAULT 0,
    total_cash_sales DECIMAL(15,2) DEFAULT 0,
    total_expenses   DECIMAL(15,2) DEFAULT 0,
    status           ENUM('open','closed') DEFAULT 'open',
    notes            TEXT          NULL,
    open_notes       TEXT          NULL,
    created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    expense_date   DATE          NOT NULL,
    category       VARCHAR(100)  NOT NULL,
    description    VARCHAR(255)  NOT NULL DEFAULT '',
    amount         DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(30)   NOT NULL DEFAULT 'cash',
    user_id        INT           NOT NULL,
    notes          TEXT          NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)        REFERENCES users(id)             ON DELETE RESTRICT,
    FOREIGN KEY (payment_method) REFERENCES payment_methods(code)
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Stok
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stock_mutations (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT                                  NULL,
    mutation_type  ENUM('in','out','adjustment','void') NOT NULL,
    quantity       DECIMAL(15,3)                        NOT NULL,
    stock_before   DECIMAL(15,3)                        NOT NULL,
    stock_after    DECIMAL(15,3)                        NOT NULL,
    reference_type VARCHAR(50)                          NULL,
    reference_id   INT                                  NULL,
    notes          TEXT                                 NULL,
    user_id        INT                                  NULL,
    created_at     DATETIME                             DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Sistem & Versi
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_versions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    platform      ENUM('android','desktop') NOT NULL,
    version       VARCHAR(20)               NOT NULL,
    download_url  VARCHAR(500)              NULL,
    release_notes TEXT                      NULL,
    is_latest     TINYINT(1)                DEFAULT 1,
    is_mandatory  TINYINT(1)                NOT NULL DEFAULT 0,
    created_at    DATETIME                  DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Sinkronisasi
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_conflicts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    entity_type     VARCHAR(50)                NOT NULL,
    entity_id       INT                        NOT NULL,
    local_id        VARCHAR(36)                NULL,
    device_id       VARCHAR(100)               NOT NULL DEFAULT '',
    desktop_data    JSON                        NOT NULL,
    online_data     JSON                        NOT NULL,
    desktop_time    DATETIME                   NOT NULL,
    online_time     DATETIME                   NOT NULL,
    status          ENUM('pending','resolved') DEFAULT 'pending',
    resolved_by     INT                        NULL,
    resolution      ENUM('desktop','online')   NULL,
    resolved_action ENUM('approve','reject')   NULL,
    resolved_at     DATETIME                   NULL,
    created_at      DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_queue (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    device_id     VARCHAR(100)                                NOT NULL,
    entity_type   VARCHAR(50)                                 NOT NULL,
    entity_id     INT                                         NULL,
    action        ENUM('create','update','delete')            NOT NULL,
    payload       JSON                                        NOT NULL,
    status        ENUM('pending','syncing','synced','failed') DEFAULT 'pending',
    retry_count   INT                                         DEFAULT 0,
    error_message TEXT                                        NULL,
    created_at    DATETIME                                    DEFAULT CURRENT_TIMESTAMP,
    synced_at     DATETIME                                    NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_history (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id      VARCHAR(100)                       NOT NULL,
    device_type    ENUM('desktop','web','android')    DEFAULT 'desktop',
    total_items    INT                                DEFAULT 0,
    synced_items   INT                                DEFAULT 0,
    conflict_items INT                                DEFAULT 0,
    failed_items   INT                                DEFAULT 0,
    duration_ms    INT                                NULL,
    status         ENUM('success','partial','failed') DEFAULT 'success',
    started_at     DATETIME                           NOT NULL,
    finished_at    DATETIME                           NULL
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Logging
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS log_requests (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    method        VARCHAR(10)  NOT NULL,
    endpoint      VARCHAR(255) NOT NULL,
    status_code   SMALLINT     NULL,
    request_body  TEXT         NULL,
    response_body TEXT         NULL,
    user_id       INT          NULL,
    duration_ms   INT          NULL,
    ip_address    VARCHAR(45)  NULL,
    error_message TEXT         NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- =============================================================
-- Indexes
-- =============================================================

-- Products
CREATE INDEX idx_products_category        ON products(category_id);
CREATE INDEX idx_products_unit            ON products(unit_id);

-- Product Packages
CREATE INDEX idx_product_packages_product ON product_packages(product_id);
CREATE INDEX idx_product_packages_unit    ON product_packages(unit_id);

-- Transactions
CREATE INDEX idx_transactions_date        ON transactions(transaction_date);
CREATE INDEX idx_transactions_user        ON transactions(user_id);
CREATE INDEX idx_transaction_items_trx    ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_prod   ON transaction_items(product_id);

-- Purchases
CREATE INDEX idx_purchases_supplier       ON purchases(supplier_id);
CREATE INDEX idx_purchases_date           ON purchases(purchase_date);
CREATE INDEX idx_purchase_payments        ON purchase_payments(purchase_id);

-- Stock
CREATE INDEX idx_stock_mutations_product  ON stock_mutations(product_id);
CREATE INDEX idx_stock_mutations_ref      ON stock_mutations(reference_type, reference_id);

-- Receivables
CREATE INDEX idx_receivables_customer     ON receivables(customer_id);

-- RBAC
CREATE INDEX idx_menus_parent             ON menus(parent_id);
CREATE INDEX idx_menus_order              ON menus(order_index);
CREATE INDEX idx_role_menu_role_id        ON role_menu_access(role_id);
CREATE INDEX idx_role_menu_menu_id        ON role_menu_access(menu_id);

-- Sync
CREATE INDEX idx_sync_queue_status        ON sync_queue(status);
CREATE INDEX idx_sync_queue_device        ON sync_queue(device_id);
CREATE INDEX idx_sync_conflicts_status    ON sync_conflicts(status);
CREATE INDEX idx_sync_conflicts_entity    ON sync_conflicts(entity_type, entity_id);
CREATE INDEX idx_sync_history_device      ON sync_history(device_id);
CREATE INDEX idx_sync_history_started     ON sync_history(started_at);
