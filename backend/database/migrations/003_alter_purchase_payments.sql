-- =============================================================
-- Migration 003: Alter purchase_payments — FK payment_method
-- Menambahkan FK constraint pada kolom payment_method agar
-- konsisten dengan tabel payment_methods.
-- =============================================================

-- Sesuaikan panjang kolom dari VARCHAR(50) ke VARCHAR(30) agar
-- cocok dengan payment_methods.code, lalu tambah FK constraint.
ALTER TABLE purchase_payments
    MODIFY COLUMN payment_method VARCHAR(30) NOT NULL DEFAULT 'tunai',
    ADD CONSTRAINT fk_purchase_payments_method
        FOREIGN KEY (payment_method) REFERENCES payment_methods(code);
