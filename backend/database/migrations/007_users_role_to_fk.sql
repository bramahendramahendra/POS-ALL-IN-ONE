-- =============================================================
-- Migration 007: Ubah users.role ENUM menjadi role_id FK
-- Data preservation: role_id diisi dari tabel roles berdasarkan
-- nilai kolom role (string) yang sudah ada.
-- Kolom role (ENUM) dihapus setelah role_id terisi.
-- =============================================================

-- Step 1: Tambah kolom role_id (nullable dulu agar bisa diisi bertahap)
ALTER TABLE users ADD COLUMN role_id INT NULL AFTER full_name;

-- Step 2: Isi role_id berdasarkan nilai role ENUM yang sudah ada
UPDATE users u
INNER JOIN roles r ON r.name = u.role
SET u.role_id = r.id;

-- Step 3: Jadikan NOT NULL setelah semua baris terisi
ALTER TABLE users MODIFY COLUMN role_id INT NOT NULL;

-- Step 4: Tambah FK constraint
ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id);

-- Step 5: Hapus kolom role ENUM yang lama
ALTER TABLE users DROP COLUMN role;

-- Step 6: Update sessions.user_role agar tetap sinkron (varchar, sudah benar)
-- Kolom ini menyimpan nama role sebagai string, tidak perlu diubah strukturnya.
-- Namun pastikan semua session aktif sudah memiliki user_role yang benar.
UPDATE sessions s
INNER JOIN users u  ON u.id = s.user_id
INNER JOIN roles r  ON r.id = u.role_id
SET s.user_role = r.name
WHERE s.user_role IS NULL OR s.user_role = '';
