-- Migration 005: Supplier Returns

CREATE TABLE IF NOT EXISTS supplier_returns (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    return_code         VARCHAR(50) UNIQUE NOT NULL,
    purchase_id         INT NOT NULL,
    supplier_id         INT NULL,
    supplier_name       VARCHAR(200) NOT NULL,
    return_date         DATE NOT NULL,
    total_return_amount DECIMAL(15,2) DEFAULT 0,
    reason              TEXT NOT NULL,
    status              ENUM('pending','approved','rejected') DEFAULT 'pending',
    user_id             INT NOT NULL,
    notes               TEXT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS supplier_return_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    return_id       INT NOT NULL,
    purchase_item_id INT NOT NULL,
    product_id      INT NOT NULL,
    product_name    VARCHAR(200) NOT NULL,
    quantity        DECIMAL(15,4) NOT NULL,
    unit            VARCHAR(50) NOT NULL,
    purchase_price  DECIMAL(15,2) NOT NULL,
    subtotal        DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (return_id) REFERENCES supplier_returns(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
)
