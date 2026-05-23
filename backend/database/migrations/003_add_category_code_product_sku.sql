-- =============================================================
-- Migration 003: Tambah kolom code di categories, sku di products
-- =============================================================

ALTER TABLE categories
    ADD COLUMN code VARCHAR(10) NULL UNIQUE AFTER name;

ALTER TABLE products
    ADD COLUMN sku VARCHAR(50) NULL UNIQUE AFTER barcode;
