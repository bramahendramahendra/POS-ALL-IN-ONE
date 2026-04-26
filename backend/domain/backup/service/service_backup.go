package service_backup

import (
	"fmt"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"permen_api/config"
	dto_backup "permen_api/domain/backup/dto"
	"permen_api/errors"
)

const backupDir = "backups"

type backupService struct{}

func NewBackupService() BackupService {
	return &backupService{}
}

func (s *backupService) CreateBackup() (*dto_backup.BackupInfo, error) {
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membuat folder backup"}
	}

	filename := fmt.Sprintf("backup_%s.sql", time.Now().Format("20060102_150405"))
	backupPath := filepath.Join(backupDir, filename)

	cmd := exec.Command("mysqldump",
		"-h", config.Db.Host,
		"-P", config.Db.Port,
		"-u", config.Db.User,
		fmt.Sprintf("-p%s", config.Db.Password),
		config.Db.Database,
	)

	outFile, err := os.Create(backupPath)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membuat file backup"}
	}
	defer outFile.Close()

	cmd.Stdout = outFile

	if err := cmd.Run(); err != nil {
		os.Remove(backupPath)
		return nil, &errors.InternalServerError{Message: "Gagal menjalankan mysqldump: " + err.Error()}
	}

	info, err := os.Stat(backupPath)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membaca info file backup"}
	}

	return &dto_backup.BackupInfo{
		Filename:  filename,
		Size:      formatFileSize(info.Size()),
		CreatedAt: info.ModTime(),
	}, nil
}

func (s *backupService) GetList() (*dto_backup.BackupListResponse, error) {
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membaca folder backup"}
	}

	entries, err := os.ReadDir(backupDir)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membaca daftar backup"}
	}

	var files []dto_backup.BackupInfo
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		files = append(files, dto_backup.BackupInfo{
			Filename:  entry.Name(),
			Size:      formatFileSize(info.Size()),
			CreatedAt: info.ModTime(),
		})
	}

	sort.Slice(files, func(i, j int) bool {
		return files[i].CreatedAt.After(files[j].CreatedAt)
	})

	return &dto_backup.BackupListResponse{Files: files}, nil
}

func (s *backupService) RestoreBackup(file *multipart.FileHeader) error {
	src, err := file.Open()
	if err != nil {
		return &errors.BadRequestError{Message: "Gagal membuka file restore"}
	}
	defer src.Close()

	tmpPath := filepath.Join(os.TempDir(), fmt.Sprintf("restore_%d.sql", time.Now().UnixNano()))
	tmpFile, err := os.Create(tmpPath)
	if err != nil {
		return &errors.InternalServerError{Message: "Gagal membuat file sementara"}
	}

	buf := make([]byte, 32*1024)
	for {
		n, readErr := src.Read(buf)
		if n > 0 {
			if _, writeErr := tmpFile.Write(buf[:n]); writeErr != nil {
				tmpFile.Close()
				os.Remove(tmpPath)
				return &errors.InternalServerError{Message: "Gagal menyimpan file sementara"}
			}
		}
		if readErr != nil {
			break
		}
	}
	tmpFile.Close()
	defer os.Remove(tmpPath)

	sqlFile, err := os.Open(tmpPath)
	if err != nil {
		return &errors.InternalServerError{Message: "Gagal membaca file restore"}
	}
	defer sqlFile.Close()

	cmd := exec.Command("mysql",
		"-h", config.Db.Host,
		"-P", config.Db.Port,
		"-u", config.Db.User,
		fmt.Sprintf("-p%s", config.Db.Password),
		config.Db.Database,
	)
	cmd.Stdin = sqlFile

	if err := cmd.Run(); err != nil {
		return &errors.InternalServerError{Message: "Gagal melakukan restore: " + err.Error()}
	}

	return nil
}

func formatFileSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
