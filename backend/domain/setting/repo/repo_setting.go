package repo_setting

import (
	model_setting "permen_api/domain/setting/model"

	"gorm.io/gorm"
)

const (
	getAllSettingsQuery  = `SELECT setting_key, setting_value FROM settings ORDER BY setting_key`
	getSettingByKeyQuery = `SELECT setting_key, setting_value FROM settings WHERE setting_key = ?`
	upsertSettingQuery  = `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`
	resetSettingsQuery  = `UPDATE settings SET setting_value = CASE setting_key WHEN 'store_name' THEN 'Toko Retail' WHEN 'tax_enabled' THEN '0' WHEN 'tax_percent' THEN '11' WHEN 'receipt_footer' THEN 'Terima kasih telah berbelanja' WHEN 'stock_notification_enabled' THEN '1' ELSE '' END`
)

type settingRepo struct {
	db *gorm.DB
}

func NewSettingRepo(db *gorm.DB) SettingRepo {
	return &settingRepo{db: db}
}

func (r *settingRepo) GetAll() ([]model_setting.Setting, error) {
	var settings []model_setting.Setting
	rows, err := r.db.Raw(getAllSettingsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s model_setting.Setting
		if err := rows.Scan(&s.Key, &s.Value); err != nil {
			return nil, err
		}
		settings = append(settings, s)
	}
	return settings, rows.Err()
}

func (r *settingRepo) GetByKey(key string) (*model_setting.Setting, error) {
	var s model_setting.Setting
	rows, err := r.db.Raw(getSettingByKeyQuery, key).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		if err := rows.Scan(&s.Key, &s.Value); err != nil {
			return nil, err
		}
		return &s, nil
	}
	return nil, nil
}

func (r *settingRepo) Upsert(key, value string) error {
	return r.db.Exec(upsertSettingQuery, key, value).Error
}

func (r *settingRepo) ResetAll() error {
	return r.db.Exec(resetSettingsQuery).Error
}
