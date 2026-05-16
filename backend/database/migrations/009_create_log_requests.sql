-- Migration 009: Create log_requests table

CREATE TABLE IF NOT EXISTS log_requests (
    id            VARCHAR(36)   NOT NULL PRIMARY KEY,
    method        VARCHAR(10)   NOT NULL,
    endpoint      VARCHAR(255)  NOT NULL,
    status_code   SMALLINT      NULL,
    request_body  TEXT          NULL,
    response_body TEXT          NULL,
    user_id       INT           NULL,
    duration_ms   INT           NULL,
    ip_address    VARCHAR(45)   NULL,
    error_message TEXT          NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;
