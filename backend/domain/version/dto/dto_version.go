package dto_version

type VersionCheckResponse struct {
	LatestVersion  string `json:"latest_version"`
	CurrentVersion string `json:"current_version"`
	HasUpdate      bool   `json:"has_update"`
	DownloadURL    string `json:"download_url,omitempty"`
	ReleaseNotes   string `json:"release_notes,omitempty"`
	IsMandatory    bool   `json:"is_mandatory,omitempty"`
}

type UpdateVersionRequest struct {
	Version      string `json:"version" binding:"required"`
	DownloadURL  string `json:"download_url" binding:"required"`
	ReleaseNotes string `json:"release_notes"`
	IsMandatory  bool   `json:"is_mandatory"`
}
