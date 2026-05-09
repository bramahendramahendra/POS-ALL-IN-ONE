-- Migration 006: Update sync_conflicts for fase 6.1 conflict detection
-- Tambah kolom local_id dan device_id untuk tracking per-device conflict
-- Tambah kolom resolved_action dengan enum approve/reject (replace resolution)

ALTER TABLE sync_conflicts
    ADD COLUMN local_id        VARCHAR(36)   NULL AFTER entity_id,
    ADD COLUMN device_id       VARCHAR(100)  NOT NULL DEFAULT '' AFTER local_id,
    ADD COLUMN resolved_action ENUM('approve','reject') NULL AFTER resolution;

-- Index untuk query performance
CREATE INDEX idx_sync_conflicts_status ON sync_conflicts(status);
CREATE INDEX idx_sync_conflicts_entity ON sync_conflicts(entity_type, entity_id);
