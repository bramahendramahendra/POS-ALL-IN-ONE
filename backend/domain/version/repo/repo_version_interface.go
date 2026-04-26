package repo_version

import (
	model_version "permen_api/domain/version/model"
)

type VersionRepo interface {
	GetLatestAndroid() (*model_version.AppVersion, error)
	SetAllNotLatest() error
	CreateVersion(version, downloadURL, releaseNotes string, isMandatory bool) error
}
