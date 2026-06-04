-- Tambah kolom conversion_qty ke purchase_items
-- Kolom ini menyimpan kelipatan konversi satuan grosir ke satuan dasar
-- Contoh: beli 2 Dus (x12) → conversion_qty=12, stock bertambah 2×12=24
ALTER TABLE purchase_items
    ADD COLUMN conversion_qty DECIMAL(15,3) NOT NULL DEFAULT 1 AFTER unit;
