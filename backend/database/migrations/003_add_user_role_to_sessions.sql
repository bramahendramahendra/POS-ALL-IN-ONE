ALTER TABLE sessions ADD COLUMN user_role VARCHAR(20) NOT NULL DEFAULT 'kasir' AFTER user_id;
