package service_backup

import (
	dto_backup "pos_api/domain/backup/dto"

	"mime/multipart"
)

type BackupService interface {
	CreateBackup() (*dto_backup.BackupInfo, error)
	GetList() (*dto_backup.BackupListResponse, error)
	RestoreBackup(file *multipart.FileHeader) error
}
