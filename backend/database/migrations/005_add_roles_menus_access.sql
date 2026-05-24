-- =============================================================
-- Migration 005: Role, Menu, dan Role Menu Access
-- Menambah sistem RBAC dinamis: tabel roles, menus, role_menu_access.
-- Tabel users.role (ENUM) tetap dipertahankan sementara untuk kompatibilitas
-- backward. Migrasi kolom users ke role_id FK dilakukan di migration 007.
-- =============================================================

-- -------------------------------------------------------------
-- Roles — master role yang bisa ditambah/edit oleh owner
-- is_system = 1 artinya role bawaan sistem, tidak bisa dihapus
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(50)  UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description  VARCHAR(255) NULL,
    is_system    TINYINT(1)   DEFAULT 0,
    is_active    TINYINT(1)   DEFAULT 1,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Menus — semua item menu yang dikelola dari backend
-- parent_id NULL = menu top-level, isi = sub-menu (children)
-- path NULL = menu grup (tidak punya halaman sendiri)
-- order_index = urutan tampil di sidebar
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menus (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    parent_id   INT          NULL,
    key_name    VARCHAR(100) UNIQUE NOT NULL,
    label       VARCHAR(100) NOT NULL,
    icon        VARCHAR(100) NULL,
    path        VARCHAR(200) NULL,
    order_index INT          DEFAULT 0,
    is_active   TINYINT(1)   DEFAULT 1,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Role Menu Access — mapping role ke menu beserta permission CRUD
-- Setiap kombinasi role+menu harus unik
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_menu_access (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    role_id    INT        NOT NULL,
    menu_id    INT        NOT NULL,
    can_view   TINYINT(1) DEFAULT 1,
    can_create TINYINT(1) DEFAULT 0,
    can_edit   TINYINT(1) DEFAULT 0,
    can_delete TINYINT(1) DEFAULT 0,
    created_at DATETIME   DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_menu (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4;

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX idx_menus_parent        ON menus(parent_id);
CREATE INDEX idx_menus_order         ON menus(order_index);
CREATE INDEX idx_role_menu_role_id   ON role_menu_access(role_id);
CREATE INDEX idx_role_menu_menu_id   ON role_menu_access(menu_id);
