package repo_setting

import (
	model_setting "permen_api/domain/setting/model"
)

type SettingRepo interface {
	GetAll() ([]model_setting.Setting, error)
	GetByKey(key string) (*model_setting.Setting, error)
	Upsert(key, value string) error
	ResetAll() error
}
