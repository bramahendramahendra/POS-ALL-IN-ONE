-- Migration 001: Initial Schema

CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(100) NOT NULL,
    role       ENUM('owner','admin','kasir') NOT NULL,
    pin_hash   VARCHAR(255) NULL,
    is_active  TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    token         TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    device_info   VARCHAR(100) NULL,
    ip_address    VARCHAR(50) NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME NOT NULL,
    UNIQUE KEY unique_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    is_active    TINYINT(1) DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    barcode        VARCHAR(100) UNIQUE NULL,
    name           VARCHAR(200) NOT NULL,
    category_id    INT NULL,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    selling_price  DECIMAL(15,2) DEFAULT 0,
    stock          DECIMAL(15,3) DEFAULT 0,
    min_stock      DECIMAL(15,3) DEFAULT 0,
    unit           VARCHAR(50) DEFAULT 'pcs',
    is_active      TINYINT(1) DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_units (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT NOT NULL,
    unit_id        INT NULL,
    unit_name      VARCHAR(50) NOT NULL,
    conversion_qty DECIMAL(15,3) NOT NULL DEFAULT 1,
    selling_price  DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_default     TINYINT(1) DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_prices (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    tier_name  VARCHAR(100) NOT NULL,
    min_qty    DECIMAL(15,3) NOT NULL DEFAULT 1,
    price      DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suppliers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code  VARCHAR(50) UNIQUE NOT NULL,
    name           VARCHAR(200) NOT NULL,
    address        TEXT NULL,
    phone          VARCHAR(50) NULL,
    email          VARCHAR(100) NULL,
    contact_person VARCHAR(100) NULL,
    notes          TEXT NULL,
    is_active      TINYINT(1) DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    purchase_code    VARCHAR(50) UNIQUE NOT NULL,
    supplier_id      INT NULL,
    supplier_name    VARCHAR(200) NOT NULL,
    purchase_date    DATE NOT NULL,
    total_amount     DECIMAL(15,2) DEFAULT 0,
    payment_status   ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    paid_amount      DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) DEFAULT 0,
    user_id          INT NULL,
    notes            TEXT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id    INT NOT NULL,
    product_id     INT NULL,
    product_name   VARCHAR(200) NOT NULL,
    quantity       DECIMAL(15,3) NOT NULL,
    unit           VARCHAR(50) NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    subtotal       DECIMAL(15,2) NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supplier_returns (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    return_code         VARCHAR(50) UNIQUE NOT NULL,
    purchase_id         INT NULL,
    supplier_id         INT NULL,
    supplier_name       VARCHAR(200) NOT NULL,
    return_date         DATE NOT NULL,
    total_return_amount DECIMAL(15,2) DEFAULT 0,
    reason              TEXT NULL,
    status              ENUM('pending','approved','rejected') DEFAULT 'pending',
    user_id             INT NULL,
    notes               TEXT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supplier_return_items (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    return_id        INT NOT NULL,
    purchase_item_id INT NULL,
    product_id       INT NULL,
    product_name     VARCHAR(200) NOT NULL,
    quantity         DECIMAL(15,3) NOT NULL,
    unit             VARCHAR(50) NOT NULL,
    purchase_price   DECIMAL(15,2) NOT NULL,
    subtotal         DECIMAL(15,2) NOT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES supplier_returns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name          VARCHAR(200) NOT NULL,
    phone         VARCHAR(50) NULL,
    address       TEXT NULL,
    credit_limit  DECIMAL(15,2) DEFAULT 0,
    is_active     TINYINT(1) DEFAULT 1,
    notes         TEXT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    is_active  TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    user_id          INT NULL,
    shift_id         INT NULL,
    transaction_date DATETIME NOT NULL,
    subtotal         DECIMAL(15,2) DEFAULT 0,
    discount         DECIMAL(15,2) DEFAULT 0,
    tax              DECIMAL(15,2) DEFAULT 0,
    total_amount     DECIMAL(15,2) DEFAULT 0,
    payment_method   ENUM('cash','debit','credit','qris') DEFAULT 'cash',
    payment_amount   DECIMAL(15,2) DEFAULT 0,
    change_amount    DECIMAL(15,2) DEFAULT 0,
    customer_id      INT NULL,
    is_credit        TINYINT(1) DEFAULT 0,
    status           ENUM('pending','completed','void') DEFAULT 'completed',
    device_source    ENUM('desktop','web','android') DEFAULT 'web',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id     INT NULL,
    product_name   VARCHAR(200) NOT NULL,
    quantity       DECIMAL(15,3) NOT NULL,
    unit           VARCHAR(50) NOT NULL,
    price          DECIMAL(15,2) NOT NULL,
    subtotal       DECIMAL(15,2) NOT NULL,
    discount_item  DECIMAL(15,2) DEFAULT 0,
    conversion_qty DECIMAL(15,3) DEFAULT 1,
    unit_id        INT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS receivables (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id   INT NULL,
    customer_id      INT NULL,
    total_amount     DECIMAL(15,2) NOT NULL,
    paid_amount      DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    status           ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    due_date         DATE NULL,
    notes            TEXT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS receivable_payments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    receivable_id  INT NOT NULL,
    payment_date   DATE NOT NULL,
    amount         DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash','debit','credit','qris') DEFAULT 'cash',
    notes          TEXT NULL,
    user_id        INT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cash_drawer (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NULL,
    shift_id         INT NULL,
    open_time        DATETIME NOT NULL,
    close_time       DATETIME NULL,
    opening_balance  DECIMAL(15,2) DEFAULT 0,
    closing_balance  DECIMAL(15,2) NULL,
    expected_balance DECIMAL(15,2) DEFAULT 0,
    difference       DECIMAL(15,2) DEFAULT 0,
    total_sales      DECIMAL(15,2) DEFAULT 0,
    total_cash_sales DECIMAL(15,2) DEFAULT 0,
    total_expenses   DECIMAL(15,2) DEFAULT 0,
    status           ENUM('open','closed') DEFAULT 'open',
    notes            TEXT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    expense_date   DATE NOT NULL,
    category       VARCHAR(100) NOT NULL,
    description    TEXT NULL,
    amount         DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash','debit','credit','qris') DEFAULT 'cash',
    user_id        INT NULL,
    notes          TEXT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_mutations (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT NULL,
    mutation_type  ENUM('in','out','adjustment','void') NOT NULL,
    quantity       DECIMAL(15,3) NOT NULL,
    stock_before   DECIMAL(15,3) NOT NULL,
    stock_after    DECIMAL(15,3) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id   INT NULL,
    notes          TEXT NULL,
    user_id        INT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    setting_key   VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    INT NOT NULL,
    desktop_data JSON NOT NULL,
    online_data  JSON NOT NULL,
    desktop_time DATETIME NOT NULL,
    online_time  DATETIME NOT NULL,
    status       ENUM('pending','resolved') DEFAULT 'pending',
    resolved_by  INT NULL,
    resolution   ENUM('desktop','online') NULL,
    resolved_at  DATETIME NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    device_id     VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(50) NOT NULL,
    entity_id     INT NULL,
    action        ENUM('create','update','delete') NOT NULL,
    payload       JSON NOT NULL,
    status        ENUM('pending','syncing','synced','failed') DEFAULT 'pending',
    retry_count   INT DEFAULT 0,
    error_message TEXT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at     DATETIME NULL
);

CREATE TABLE IF NOT EXISTS app_versions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    platform      ENUM('android','desktop') NOT NULL,
    version       VARCHAR(20) NOT NULL,
    download_url  VARCHAR(500) NULL,
    release_notes TEXT NULL,
    is_latest     TINYINT(1) DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_category       ON products(category_id);
CREATE INDEX idx_transactions_date       ON transactions(transaction_date);
CREATE INDEX idx_transactions_user       ON transactions(user_id);
CREATE INDEX idx_transaction_items_trx   ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_prod  ON transaction_items(product_id);
CREATE INDEX idx_purchases_supplier      ON purchases(supplier_id);
CREATE INDEX idx_purchases_date          ON purchases(purchase_date);
CREATE INDEX idx_stock_mutations_product ON stock_mutations(product_id);
CREATE INDEX idx_stock_mutations_ref     ON stock_mutations(reference_type, reference_id);
CREATE INDEX idx_receivables_customer    ON receivables(customer_id);
CREATE INDEX idx_sync_queue_status       ON sync_queue(status);
CREATE INDEX idx_sync_queue_device       ON sync_queue(device_id);
