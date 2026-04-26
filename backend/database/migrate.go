package database

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"

	"gorm.io/gorm"
)

func RunMigrations(db *gorm.DB) error {
	if err := ensureMigrationsTable(db); err != nil {
		return fmt.Errorf("create migrations_history: %w", err)
	}

	migrationsDir := migrationsPath()
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, filename := range files {
		already, err := isMigrated(db, filename)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", filename, err)
		}
		if already {
			continue
		}

		content, err := os.ReadFile(filepath.Join(migrationsDir, filename))
		if err != nil {
			return fmt.Errorf("read %s: %w", filename, err)
		}

		if err := execSQL(db, string(content)); err != nil {
			return fmt.Errorf("execute %s: %w", filename, err)
		}

		if err := recordMigration(db, filename); err != nil {
			return fmt.Errorf("record %s: %w", filename, err)
		}
	}

	return nil
}

func ensureMigrationsTable(db *gorm.DB) error {
	sql := `CREATE TABLE IF NOT EXISTS migrations_history (
		id          INT AUTO_INCREMENT PRIMARY KEY,
		filename    VARCHAR(255) UNIQUE NOT NULL,
		executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`
	return db.Exec(sql).Error
}

func isMigrated(db *gorm.DB, filename string) (bool, error) {
	var count int64
	err := db.Raw("SELECT COUNT(*) FROM migrations_history WHERE filename = ?", filename).Scan(&count).Error
	return count > 0, err
}

func recordMigration(db *gorm.DB, filename string) error {
	return db.Exec("INSERT INTO migrations_history (filename) VALUES (?)", filename).Error
}

// execSQL splits the content on semicolons and runs each statement individually
// so that GORM (which uses database/sql) can handle multi-statement SQL files.
func execSQL(db *gorm.DB, content string) error {
	statements := strings.Split(content, ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}
		if err := db.Exec(stmt).Error; err != nil {
			return err
		}
	}
	return nil
}

// migrationsPath resolves the migrations directory relative to this source file.
func migrationsPath() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(filename), "migrations")
}
