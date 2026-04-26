package service_setting

type SettingService interface {
	GetAll() (map[string]string, error)
	GetByKey(key string) (string, error)
	Save(data map[string]string) error
	Reset() error
}
