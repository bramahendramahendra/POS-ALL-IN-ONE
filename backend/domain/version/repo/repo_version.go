package repo_version

import (
	model_version "permen_api/domain/version/model"

	"gorm.io/gorm"
)

const (
	GetLatestVersionQuery = `SELECT version, download_url, release_notes, is_mandatory FROM app_versions WHERE platform = 'android' AND is_latest = 1 LIMIT 1`
	SetAllNotLatestQuery  = `UPDATE app_versions SET is_latest = 0 WHERE platform = 'android'`
	CreateVersionQuery    = `INSERT INTO app_versions (platform, version, download_url, release_notes, is_mandatory, is_latest) VALUES ('android', ?, ?, ?, ?, 1)`
)

type versionRepo struct {
	db *gorm.DB
}

func NewVersionRepo(db *gorm.DB) VersionRepo {
	return &versionRepo{db: db}
}

func (r *versionRepo) GetLatestAndroid() (*model_version.AppVersion, error) {
	v := &model_version.AppVersion{}
	err := r.db.Raw(GetLatestVersionQuery).Scan(v).Error
	if err != nil {
		return nil, err
	}
	return v, nil
}

func (r *versionRepo) SetAllNotLatest() error {
	return r.db.Exec(SetAllNotLatestQuery).Error
}

func (r *versionRepo) CreateVersion(version, downloadURL, releaseNotes string, isMandatory bool) error {
	return r.db.Exec(CreateVersionQuery, version, downloadURL, releaseNotes, isMandatory).Error
}
