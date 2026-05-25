CREATE TABLE IF NOT EXISTS purchase_payments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    notes       TEXT,
    user_id     INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_payments_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    CONSTRAINT fk_purchase_payments_user    FOREIGN KEY (user_id)     REFERENCES users(id)
);
