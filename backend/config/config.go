package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

const (
	envPath = "./.env"

	DefaultFormatTime = "2006-01-02 15:04:05"
	DefaultFormatDate = "2006-01-02"
)

type Env struct {
	AppName     string
	AppVersion  string
	AppPort     string
	ReleaseMode string
}

type DatabaseConfig struct {
	Type            string `json:"Type"`
	Host            string `json:"Host"`
	Port            string `json:"Port"`
	User            string `json:"User"`
	Password        string `json:"Password"`
	Database        string `json:"Database"`
	MaxOpenConns    int    `json:"MaxOpenConns"`
	MaxIdleConns    int    `json:"MaxIdleConns"`
	MaxLifetime     int    `json:"MaxLifetime"`
	ConnMaxLifeTime int    `json:"ConnMaxLifeTime"`
	ConnMaxIdleTime int    `json:"ConnMaxIdleTime"`
}

// RedisConfig kept for packages that reference it
type RedisConfig struct {
	Host         string
	Port         string
	Password     string
	Db           int
	PoolSize     int
	MinIdleConns int
}

type Config struct {
	AppName            string         `json:"AppName"`
	AppVersion         string         `json:"AppVersion"`
	AppPort            string         `json:"AppPort"`
	Timezone           string         `json:"Timezone"`
	ReleaseMode        string         `json:"ReleaseMode"`
	SecretKey          string         `json:"SecretKey"`
	TokenExpire        int            `json:"TokenExpire"`
	RefreshTokenExpire int            `json:"RefreshTokenExpire"`
	Database           DatabaseConfig `json:"Database"`
	CorsAllowOrigins   []string       `json:"CorsAllowOrigins"`
	LogPath            string         `json:"LogPath"`
	MaxLogAge          int            `json:"MaxLogAge"`
}

// generalCompat provides backward compatibility for code referencing config.General
type generalCompat struct {
	SecretKey                  string
	TokenExpire                int
	MaxTimeoutGracefulShutdown int
	FormatTime                 string
	FormatDate                 string
}

var (
	configMap = map[string]string{
		"dev":  "./config/config_dev.json",
		"prod": "./config/config_prod.json",
	}
	ENV      *Env
	Cfg      *Config
	Db       *DatabaseConfig
	Location *time.Location
	FormatTime string

	// General exposes frequently-used fields for backward compatibility
	General = &generalCompat{
		FormatTime: DefaultFormatTime,
		FormatDate: DefaultFormatDate,
		MaxTimeoutGracefulShutdown: 5,
	}
)

func init() {
	initEnv()
	initConfig(ENV.ReleaseMode)
	initTimeConfig()
}

func initEnv() {
	v := viper.New()
	v.SetConfigFile(envPath)
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		panic(fmt.Sprintf("Error reading Env file : %v", err))
	}

	ENV = &Env{
		AppName:     v.GetString("APP_NAME"),
		AppVersion:  v.GetString("APP_VERSION"),
		AppPort:     v.GetString("APP_PORT"),
		ReleaseMode: v.GetString("RELEASE_MODE"),
	}
}

func initConfig(releaseMode string) {
	v := viper.New()
	v.SetConfigFile(configMap[releaseMode])
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		panic(fmt.Sprintf("Error reading config file : %v", err))
	}

	Cfg = &Config{
		AppName:            v.GetString("AppName"),
		AppVersion:         v.GetString("AppVersion"),
		AppPort:            v.GetString("AppPort"),
		Timezone:           v.GetString("Timezone"),
		ReleaseMode:        v.GetString("ReleaseMode"),
		SecretKey:          v.GetString("SecretKey"),
		TokenExpire:        v.GetInt("TokenExpire"),
		RefreshTokenExpire: v.GetInt("RefreshTokenExpire"),
		CorsAllowOrigins:   v.GetStringSlice("CorsAllowOrigins"),
		LogPath:            v.GetString("LogPath"),
		MaxLogAge:          v.GetInt("MaxLogAge"),
	}

	Db = &DatabaseConfig{
		Type:         v.GetString("Database.Type"),
		Host:         v.GetString("Database.Host"),
		Port:         v.GetString("Database.Port"),
		User:         v.GetString("Database.User"),
		Password:     v.GetString("Database.Password"),
		Database:     v.GetString("Database.Database"),
		MaxOpenConns: v.GetInt("Database.MaxOpenConns"),
		MaxIdleConns: v.GetInt("Database.MaxIdleConns"),
		MaxLifetime:  v.GetInt("Database.MaxLifetime"),
	}

	Cfg.Database = *Db

	General.SecretKey = Cfg.SecretKey
	General.TokenExpire = Cfg.TokenExpire
}

func initTimeConfig() {
	loc, err := time.LoadLocation(Cfg.Timezone)
	if err != nil {
		panic(fmt.Sprintf("Failed to load location: %s", err.Error()))
	}
	Location = loc
	FormatTime = DefaultFormatTime
}
