package model_version

type AppVersion struct {
	ID           int    `db:"id"`
	Platform     string `db:"platform"`
	Version      string `db:"version"`
	DownloadURL  string `db:"download_url"`
	ReleaseNotes string `db:"release_notes"`
	IsMandatory  bool   `db:"is_mandatory"`
	IsLatest     bool   `db:"is_latest"`
	CreatedAt    string `db:"created_at"`
}
