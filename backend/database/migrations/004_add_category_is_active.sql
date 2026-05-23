-- =============================================================
-- Migration 004: Tambah kolom is_active di categories
-- =============================================================

ALTER TABLE categories
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description;
