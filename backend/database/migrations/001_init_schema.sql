-- =============================================================
-- Migration 001 — Initial Schema
-- Project  : POS Multi-Platform
-- Database : MySQL 8.0+
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- 1. users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`         INT           NOT NULL AUTO_INCREMENT,
    `username`   VARCHAR(50)   NOT NULL,
    `password`   VARCHAR(255)  NOT NULL COMMENT 'bcrypt hash',
    `full_name`  VARCHAR(100)  NOT NULL,
    `role`       ENUM('owner','admin','kasir') NOT NULL,
    `pin_hash`   VARCHAR(255)  NULL     COMMENT 'PIN kasir',
    `is_active`  TINYINT(1)    NOT NULL DEFAULT 1,
    `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. sessions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
    `id`            INT           NOT NULL AUTO_INCREMENT,
    `user_id`       INT           NOT NULL,
    `token`         TEXT          NOT NULL,
    `refresh_token` TEXT          NOT NULL,
    `device_info`   VARCHAR(100)  NULL     COMMENT 'desktop | web | android',
    `ip_address`    VARCHAR(50)   NULL,
    `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`    DATETIME      NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sessions_user_id` (`user_id`),
    CONSTRAINT `fk_sessions_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. categories
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id`          INT          NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(100) NOT NULL,
    `description` TEXT         NULL,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 4. units
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `units` (
    `id`           INT         NOT NULL AUTO_INCREMENT,
    `name`         VARCHAR(50) NOT NULL,
    `abbreviation` VARCHAR(20) NOT NULL,
    `is_active`    TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. products
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id`             INT            NOT NULL AUTO_INCREMENT,
    `barcode`        VARCHAR(100)   NULL,
    `name`           VARCHAR(200)   NOT NULL,
    `category_id`    INT            NULL,
    `purchase_price` DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `selling_price`  DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `stock`          DECIMAL(15,3)  NOT NULL DEFAULT 0,
    `min_stock`      DECIMAL(15,3)  NOT NULL DEFAULT 0,
    `unit`           VARCHAR(50)    NOT NULL DEFAULT 'pcs',
    `is_active`      TINYINT(1)     NOT NULL DEFAULT 1,
    `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_products_barcode` (`barcode`),
    KEY `idx_products_category_id` (`category_id`),
    KEY `idx_products_name` (`name`),
    CONSTRAINT `fk_products_category_id`
        FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. product_units
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_units` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `product_id`     INT           NOT NULL,
    `unit_id`        INT           NULL,
    `unit_name`      VARCHAR(50)   NOT NULL,
    `conversion_qty` DECIMAL(15,3) NOT NULL DEFAULT 1,
    `selling_price`  DECIMAL(15,2) NOT NULL DEFAULT 0,
    `is_default`     TINYINT(1)    NOT NULL DEFAULT 0,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_units_product_id` (`product_id`),
    CONSTRAINT `fk_product_units_product_id`
        FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_product_units_unit_id`
        FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 7. product_prices
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_prices` (
    `id`         INT           NOT NULL AUTO_INCREMENT,
    `product_id` INT           NOT NULL,
    `tier_name`  VARCHAR(100)  NOT NULL,
    `min_qty`    DECIMAL(15,3) NOT NULL DEFAULT 1,
    `price`      DECIMAL(15,2) NOT NULL DEFAULT 0,
    `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_prices_product_id` (`product_id`),
    CONSTRAINT `fk_product_prices_product_id`
        FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 8. suppliers
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id`             INT          NOT NULL AUTO_INCREMENT,
    `supplier_code`  VARCHAR(50)  NOT NULL,
    `name`           VARCHAR(200) NOT NULL,
    `address`        TEXT         NULL,
    `phone`          VARCHAR(50)  NULL,
    `email`          VARCHAR(100) NULL,
    `contact_person` VARCHAR(100) NULL,
    `notes`          TEXT         NULL,
    `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_suppliers_supplier_code` (`supplier_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 9. purchases
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchases` (
    `id`               INT            NOT NULL AUTO_INCREMENT,
    `purchase_code`    VARCHAR(50)    NOT NULL,
    `supplier_id`      INT            NULL,
    `supplier_name`    VARCHAR(200)   NOT NULL,
    `purchase_date`    DATE           NOT NULL,
    `total_amount`     DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `payment_status`   ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
    `paid_amount`      DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `remaining_amount` DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `user_id`          INT            NULL,
    `notes`            TEXT           NULL,
    `created_at`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_purchases_purchase_code` (`purchase_code`),
    KEY `idx_purchases_supplier_id` (`supplier_id`),
    KEY `idx_purchases_user_id` (`user_id`),
    KEY `idx_purchases_purchase_date` (`purchase_date`),
    CONSTRAINT `fk_purchases_supplier_id`
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_purchases_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 10. purchase_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_items` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `purchase_id`    INT           NOT NULL,
    `product_id`     INT           NULL,
    `product_name`   VARCHAR(200)  NOT NULL,
    `quantity`       DECIMAL(15,3) NOT NULL,
    `unit`           VARCHAR(50)   NOT NULL,
    `purchase_price` DECIMAL(15,2) NOT NULL,
    `subtotal`       DECIMAL(15,2) NOT NULL,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_purchase_items_purchase_id` (`purchase_id`),
    KEY `idx_purchase_items_product_id` (`product_id`),
    CONSTRAINT `fk_purchase_items_purchase_id`
        FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_purchase_items_product_id`
        FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 11. supplier_returns
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `supplier_returns` (
    `id`                  INT           NOT NULL AUTO_INCREMENT,
    `return_code`         VARCHAR(50)   NOT NULL,
    `purchase_id`         INT           NULL,
    `supplier_id`         INT           NULL,
    `supplier_name`       VARCHAR(200)  NOT NULL,
    `return_date`         DATE          NOT NULL,
    `total_return_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `reason`              TEXT          NULL,
    `status`              ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    `user_id`             INT           NULL,
    `notes`               TEXT          NULL,
    `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_supplier_returns_return_code` (`return_code`),
    KEY `idx_supplier_returns_purchase_id` (`purchase_id`),
    KEY `idx_supplier_returns_supplier_id` (`supplier_id`),
    CONSTRAINT `fk_supplier_returns_purchase_id`
        FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_supplier_returns_supplier_id`
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 12. supplier_return_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `supplier_return_items` (
    `id`               INT           NOT NULL AUTO_INCREMENT,
    `return_id`        INT           NOT NULL,
    `purchase_item_id` INT           NULL,
    `product_id`       INT           NULL,
    `product_name`     VARCHAR(200)  NOT NULL,
    `quantity`         DECIMAL(15,3) NOT NULL,
    `unit`             VARCHAR(50)   NOT NULL,
    `purchase_price`   DECIMAL(15,2) NOT NULL,
    `subtotal`         DECIMAL(15,2) NOT NULL,
    `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_supplier_return_items_return_id` (`return_id`),
    CONSTRAINT `fk_supplier_return_items_return_id`
        FOREIGN KEY (`return_id`) REFERENCES `supplier_returns`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 13. customers
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
    `id`            INT           NOT NULL AUTO_INCREMENT,
    `customer_code` VARCHAR(50)   NOT NULL,
    `name`          VARCHAR(200)  NOT NULL,
    `phone`         VARCHAR(50)   NULL,
    `address`       TEXT          NULL,
    `credit_limit`  DECIMAL(15,2) NOT NULL DEFAULT 0,
    `is_active`     TINYINT(1)    NOT NULL DEFAULT 1,
    `notes`         TEXT          NULL,
    `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_customers_customer_code` (`customer_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 14. shifts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shifts` (
    `id`         INT          NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL,
    `start_time` TIME         NOT NULL,
    `end_time`   TIME         NOT NULL,
    `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 15. transactions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
    `id`               INT            NOT NULL AUTO_INCREMENT,
    `transaction_code` VARCHAR(50)    NOT NULL COMMENT 'prefix: DSK- WEB- AND-',
    `user_id`          INT            NULL,
    `shift_id`         INT            NULL,
    `transaction_date` DATETIME       NOT NULL,
    `subtotal`         DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `discount`         DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `tax`              DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `total_amount`     DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `payment_method`   ENUM('cash','debit','credit','qris') NOT NULL DEFAULT 'cash',
    `payment_amount`   DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `change_amount`    DECIMAL(15,2)  NOT NULL DEFAULT 0,
    `customer_id`      INT            NULL,
    `is_credit`        TINYINT(1)     NOT NULL DEFAULT 0,
    `status`           ENUM('pending','completed','void') NOT NULL DEFAULT 'completed',
    `device_source`    ENUM('desktop','web','android')    NOT NULL DEFAULT 'web',
    `created_at`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_transactions_transaction_code` (`transaction_code`),
    KEY `idx_transactions_user_id` (`user_id`),
    KEY `idx_transactions_customer_id` (`customer_id`),
    KEY `idx_transactions_shift_id` (`shift_id`),
    KEY `idx_transactions_transaction_date` (`transaction_date`),
    KEY `idx_transactions_status` (`status`),
    CONSTRAINT `fk_transactions_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_transactions_customer_id`
        FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_transactions_shift_id`
        FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 16. transaction_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transaction_items` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `transaction_id` INT           NOT NULL,
    `product_id`     INT           NULL,
    `product_name`   VARCHAR(200)  NOT NULL,
    `quantity`       DECIMAL(15,3) NOT NULL,
    `unit`           VARCHAR(50)   NOT NULL,
    `price`          DECIMAL(15,2) NOT NULL,
    `subtotal`       DECIMAL(15,2) NOT NULL,
    `discount_item`  DECIMAL(15,2) NOT NULL DEFAULT 0,
    `conversion_qty` DECIMAL(15,3) NOT NULL DEFAULT 1,
    `unit_id`        INT           NULL,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_transaction_items_transaction_id` (`transaction_id`),
    KEY `idx_transaction_items_product_id` (`product_id`),
    CONSTRAINT `fk_transaction_items_transaction_id`
        FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_transaction_items_product_id`
        FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 17. receivables
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `receivables` (
    `id`               INT           NOT NULL AUTO_INCREMENT,
    `transaction_id`   INT           NULL,
    `customer_id`      INT           NULL,
    `total_amount`     DECIMAL(15,2) NOT NULL,
    `paid_amount`      DECIMAL(15,2) NOT NULL DEFAULT 0,
    `remaining_amount` DECIMAL(15,2) NOT NULL,
    `status`           ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
    `due_date`         DATE          NULL,
    `notes`            TEXT          NULL,
    `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_receivables_transaction_id` (`transaction_id`),
    KEY `idx_receivables_customer_id` (`customer_id`),
    KEY `idx_receivables_status` (`status`),
    CONSTRAINT `fk_receivables_transaction_id`
        FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_receivables_customer_id`
        FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 18. receivable_payments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `receivable_payments` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `receivable_id`  INT           NOT NULL,
    `payment_date`   DATE          NOT NULL,
    `amount`         DECIMAL(15,2) NOT NULL,
    `payment_method` ENUM('cash','debit','credit','qris') NOT NULL DEFAULT 'cash',
    `notes`          TEXT          NULL,
    `user_id`        INT           NULL,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_receivable_payments_receivable_id` (`receivable_id`),
    KEY `idx_receivable_payments_user_id` (`user_id`),
    CONSTRAINT `fk_receivable_payments_receivable_id`
        FOREIGN KEY (`receivable_id`) REFERENCES `receivables`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_receivable_payments_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 19. cash_drawer
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_drawer` (
    `id`               INT           NOT NULL AUTO_INCREMENT,
    `user_id`          INT           NULL,
    `shift_id`         INT           NULL,
    `open_time`        DATETIME      NOT NULL,
    `close_time`       DATETIME      NULL,
    `opening_balance`  DECIMAL(15,2) NOT NULL DEFAULT 0,
    `closing_balance`  DECIMAL(15,2) NULL,
    `expected_balance` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `difference`       DECIMAL(15,2) NOT NULL DEFAULT 0,
    `total_sales`      DECIMAL(15,2) NOT NULL DEFAULT 0,
    `total_cash_sales` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `total_expenses`   DECIMAL(15,2) NOT NULL DEFAULT 0,
    `status`           ENUM('open','closed') NOT NULL DEFAULT 'open',
    `notes`            TEXT          NULL,
    `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cash_drawer_user_id` (`user_id`),
    KEY `idx_cash_drawer_shift_id` (`shift_id`),
    KEY `idx_cash_drawer_status` (`status`),
    CONSTRAINT `fk_cash_drawer_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_cash_drawer_shift_id`
        FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 20. expenses
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `expense_date`   DATE          NOT NULL,
    `category`       VARCHAR(100)  NOT NULL,
    `description`    TEXT          NULL,
    `amount`         DECIMAL(15,2) NOT NULL,
    `payment_method` ENUM('cash','debit','credit','qris') NOT NULL DEFAULT 'cash',
    `user_id`        INT           NULL,
    `notes`          TEXT          NULL,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_expenses_expense_date` (`expense_date`),
    KEY `idx_expenses_user_id` (`user_id`),
    CONSTRAINT `fk_expenses_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 21. stock_mutations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_mutations` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `product_id`     INT           NULL,
    `mutation_type`  ENUM('in','out','adjustment','void') NOT NULL,
    `quantity`       DECIMAL(15,3) NOT NULL,
    `stock_before`   DECIMAL(15,3) NOT NULL,
    `stock_after`    DECIMAL(15,3) NOT NULL,
    `reference_type` VARCHAR(50)   NULL COMMENT 'transaction | purchase | return | adjustment',
    `reference_id`   INT           NULL,
    `notes`          TEXT          NULL,
    `user_id`        INT           NULL,
    `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_stock_mutations_product_id` (`product_id`),
    KEY `idx_stock_mutations_reference` (`reference_type`, `reference_id`),
    KEY `idx_stock_mutations_user_id` (`user_id`),
    CONSTRAINT `fk_stock_mutations_product_id`
        FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_mutations_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 22. settings
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `setting_key`   VARCHAR(100) NOT NULL,
    `setting_value` TEXT         NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_settings_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 23. sync_conflicts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sync_conflicts` (
    `id`           INT          NOT NULL AUTO_INCREMENT,
    `entity_type`  VARCHAR(50)  NOT NULL COMMENT 'product | transaction | price | dll',
    `entity_id`    INT          NOT NULL,
    `desktop_data` JSON         NOT NULL,
    `online_data`  JSON         NOT NULL,
    `desktop_time` DATETIME     NOT NULL,
    `online_time`  DATETIME     NOT NULL,
    `status`       ENUM('pending','resolved') NOT NULL DEFAULT 'pending',
    `resolved_by`  INT          NULL COMMENT 'user_id yang resolve',
    `resolution`   ENUM('desktop','online') NULL,
    `resolved_at`  DATETIME     NULL,
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_sync_conflicts_entity` (`entity_type`, `entity_id`),
    KEY `idx_sync_conflicts_status` (`status`),
    CONSTRAINT `fk_sync_conflicts_resolved_by`
        FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 24. sync_queue
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sync_queue` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `device_id`     VARCHAR(100) NOT NULL COMMENT 'identifier device desktop',
    `entity_type`   VARCHAR(50)  NOT NULL,
    `entity_id`     INT          NULL,
    `action`        ENUM('create','update','delete') NOT NULL,
    `payload`       JSON         NOT NULL,
    `status`        ENUM('pending','syncing','synced','failed') NOT NULL DEFAULT 'pending',
    `retry_count`   INT          NOT NULL DEFAULT 0,
    `error_message` TEXT         NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `synced_at`     DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_sync_queue_device_id` (`device_id`),
    KEY `idx_sync_queue_status` (`status`),
    KEY `idx_sync_queue_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 25. app_versions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_versions` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `platform`      ENUM('android','desktop') NOT NULL,
    `version`       VARCHAR(20)  NOT NULL,
    `download_url`  VARCHAR(500) NULL,
    `release_notes` TEXT         NULL,
    `is_latest`     TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_app_versions_platform` (`platform`),
    KEY `idx_app_versions_is_latest` (`is_latest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
