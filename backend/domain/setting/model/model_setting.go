package model_setting

type Setting struct {
	Key   string `db:"setting_key"`
	Value string `db:"setting_value"`
}
