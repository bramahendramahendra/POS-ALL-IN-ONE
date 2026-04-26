-- Migration 004: Create expenses table

CREATE TABLE IF NOT EXISTS expenses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    expense_date   DATE NOT NULL,
    category       VARCHAR(100) NOT NULL,
    description    VARCHAR(255) NOT NULL DEFAULT '',
    amount         DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash','debit','credit','qris') NOT NULL DEFAULT 'cash',
    user_id        INT NOT NULL,
    notes          TEXT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);
