package database

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"

	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

func RunMigrations(db *gorm.DB) error {
	if err := ensureMigrationsTable(db); err != nil {
		return fmt.Errorf("create migrations_history: %w", err)
	}

	// Deteksi inkonsistensi: migrations_history sudah terisi tapi tidak ada tabel lain.
	// Ini terjadi jika DB pernah di-drop/reset tanpa menghapus migrations_history.
	var recordedCount, tableCount int64
	db.Raw("SELECT COUNT(*) FROM migrations_history").Scan(&recordedCount)
	db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name != 'migrations_history'").Scan(&tableCount)
	if recordedCount > 0 && tableCount == 0 {
		if err := db.Exec("TRUNCATE TABLE migrations_history").Error; err != nil {
			return fmt.Errorf("reset migrations_history: %w", err)
		}
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

		raw, err := os.ReadFile(filepath.Join(migrationsDir, filename))
		if err != nil {
			return fmt.Errorf("read %s: %w", filename, err)
		}
		// strip UTF-8 BOM if present
		content := strings.TrimPrefix(string(raw), "\xef\xbb\xbf")

		if err := execSQL(db, content); err != nil {
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
	) DEFAULT CHARSET=utf8`
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
	for stmt := range strings.SplitSeq(content, ";") {
		// strip leading comment lines before checking if the statement is empty
		stmt = stripLeadingComments(strings.TrimSpace(stmt))
		if stmt == "" {
			continue
		}
		if err := db.Exec(stmt).Error; err != nil {
			var mysqlErr *mysql.MySQLError
			if errors.As(err, &mysqlErr) && (mysqlErr.Number == 1050 || mysqlErr.Number == 1061 || mysqlErr.Number == 1060) {
				continue // table/index/column already exists, aman diabaikan
			}
			return err
		}
	}
	return nil
}

// stripLeadingComments removes leading `--` comment lines from a SQL statement
// so a statement that begins with a comment is not mistakenly skipped.
func stripLeadingComments(stmt string) string {
	lines := strings.Split(stmt, "\n")
	for len(lines) > 0 {
		trimmed := strings.TrimSpace(lines[0])
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			lines = lines[1:]
		} else {
			break
		}
	}
	return strings.TrimSpace(strings.Join(lines, "\n"))
}

// migrationsPath resolves the migrations directory relative to this source file.
func migrationsPath() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(filename), "migrations")
}
