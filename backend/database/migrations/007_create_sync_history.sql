-- Migration 007: Buat tabel sync_history untuk mencatat setiap sesi push sync
CREATE TABLE IF NOT EXISTS sync_history (
    id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    device_id      VARCHAR(100) NOT NULL,
    device_type    ENUM('desktop','web','android') DEFAULT 'desktop',
    total_items    INT          DEFAULT 0,
    synced_items   INT          DEFAULT 0,
    conflict_items INT          DEFAULT 0,
    failed_items   INT          DEFAULT 0,
    duration_ms    INT,
    status         ENUM('success','partial','failed') DEFAULT 'success',
    started_at     DATETIME     NOT NULL,
    finished_at    DATETIME,
    INDEX idx_sh_device  (device_id),
    INDEX idx_sh_started (started_at)
);
