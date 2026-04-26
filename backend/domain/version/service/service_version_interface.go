package service_version

import dto_version "permen_api/domain/version/dto"

type VersionService interface {
	CheckAndroid(currentVersion string) (*dto_version.VersionCheckResponse, error)
	UpdateAndroidVersion(req *dto_version.UpdateVersionRequest) error
}
