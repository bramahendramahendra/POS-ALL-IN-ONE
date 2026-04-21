package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

const (
	envPath = "./.env"
)

type Env struct {
	AppName     string
	AppAuthor   string
	AppVersion  string
	AppHost     string
	AppPort     string
	ReleaseMode string
}

type DatabaseConfig struct {
	Type            string
	Host            string
	Port            string
	User            string
	Password        string
	Database        string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifeTime int
	ConnMaxIdleTime int
}

type RedisConfig struct {
	Host         string
	Port         string
	Password     string
	Db           int
	PoolSize     int
	MinIdleConns int
}
type ESBConfig struct {
	Username                   string
	Password                   string
	SubbfixTellerId            string
	ServiceIDNPWP              string
	ServiceIDInquiryCASAVA     string
	ServiceIDFunTransBRIFaktur string
	ServiceIDInquiryGL         string
	ChannelId                  string
}

type ESBMonolithConfig struct {
	ServiceID000F5 string
	ServiceID000FB string
	ServiceID000H4 string
	ChannelID      string
}

type EMaterai struct {
	NoDoc          string
	EndPointUpload string
	TemplateCode   string
	Check          bool
	Kopur          int
	JenisIdentitas string
}

type BRIGateConfig struct {
	EMaterai EMaterai
	Username string
	Password string
}

type GeneralConfig struct {
	SecretKey                  string
	SecretCost                 int
	RateLimiterExp             time.Duration
	LogsPathprefix             string
	CacheSeperator             string
	TokenExpire                int
	FormatTime                 string
	FormatDate                 string
	Timezone                   string
	MaxTimeoutGracefulShutdown int
	Branch                     []string
	Kostl                      []string
}

type RestClientConfig struct {
	BrigateBaseUrl     string
	EsbBaseUrl         string
	ESBMonolithBaseUrl string
	Timeout            time.Duration
}

type BristarsConfig struct {
	AppId      string
	Url        string
	Username   string
	Password   string
	UseBrigate bool
}

type MinioConfig struct {
	Endpoint                string
	AccessKeyID             string
	SecretAccessKey         string
	UseSSL                  bool
	BucketName              string
	PresignedURLExpire      time.Duration
	PPNWapuPrefixPath       string
	DaftarPustakaPrefixPath string
}

var (
	configMap = map[string]string{
		"dev":   "./config/config_dev.json",
		"prod":  "./config/config_prod.json",
		"uat":   "./config/config_uat.json",
		"local": "./config/config_local.json",
		"bors":  "./config/config_bors_kost.json",
	}
	ENV             *Env
	Db              *DatabaseConfig
	Redis           *RedisConfig
	General         *GeneralConfig
	Bristars        *BristarsConfig
	Location        *time.Location
	FormatTime      string
	Minio           *MinioConfig
	RestClient      *RestClientConfig
	EsbConf         *ESBConfig
	EsbMonolithConf *ESBMonolithConfig
	BRIGateConf     *BRIGateConfig
	RestMode        *bool
)

func init() {
	initEnv()
	initConfig(ENV.ReleaseMode)
	initTimeConfig()
}

func initEnv() {
	viper := viper.New()
	viper.SetConfigFile(envPath)
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		errMessage := fmt.Sprintf("Error reading Env file : %v", err)
		panic(errMessage)
	}

	ENV = &Env{
		AppName:     viper.GetString("APP_NAME"),
		AppAuthor:   viper.GetString("APP_AUTHOR"),
		AppVersion:  viper.GetString("APP_VERSION"),
		AppHost:     viper.GetString("APP_HOST"),
		AppPort:     viper.GetString("APP_PORT"),
		ReleaseMode: viper.GetString("RELEASE_MODE"),
	}
}

func initConfig(releaseMode string) {
	viper := viper.New()
	viper.SetConfigFile(configMap[releaseMode])
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		errMessage := fmt.Sprintf("Error reading config file : %v", err)
		panic(errMessage)
	}

	Db = &DatabaseConfig{
		Type:            viper.GetString("Database.Type"),
		Host:            viper.GetString("Database.Host"),
		Port:            viper.GetString("Database.Port"),
		User:            viper.GetString("Database.User"),
		Password:        viper.GetString("Database.Password"),
		Database:        viper.GetString("Database.Database"),
		MaxOpenConns:    viper.GetInt("Database.MaxOpenConns"),
		MaxIdleConns:    viper.GetInt("Database.MaxIdleConns"),
		ConnMaxLifeTime: viper.GetInt("Database.MaxLifeTime"),
		ConnMaxIdleTime: viper.GetInt("Database.MaxIdleTme"),
	}

	EsbConf = &ESBConfig{
		Username:                   viper.GetString("ESBConf.Username"),
		Password:                   viper.GetString("ESBConf.Password"),
		SubbfixTellerId:            viper.GetString("ESBConf.SubfixTellerId"),
		ServiceIDNPWP:              viper.GetString("ESBConf.ServiceIdNpwp"),
		ServiceIDInquiryCASAVA:     viper.GetString("ESBConf.ServiceIdInquiryCASAVA"),
		ServiceIDFunTransBRIFaktur: viper.GetString("ESBConf.ServiceIdFunTransBRIFaktur"),
		ServiceIDInquiryGL:         viper.GetString("ESBConf.ServiceIdInquiryGL"),
		ChannelId:                  viper.GetString("ESBConf.ChannelId"),
	}

	General = &GeneralConfig{
		SecretKey:                  viper.GetString("SecretKey"),
		SecretCost:                 viper.GetInt("SecretCost"),
		RateLimiterExp:             time.Duration(viper.GetInt("RateLimiterExp")) * time.Second,
		LogsPathprefix:             viper.GetString("LogsPathprefix"),
		CacheSeperator:             viper.GetString("CacheSeperator"),
		TokenExpire:                viper.GetInt("TokenExpire"),
		FormatTime:                 viper.GetString("FormatTime"),
		FormatDate:                 viper.GetString("FormatDate"),
		Timezone:                   viper.GetString("Timezone"),
		MaxTimeoutGracefulShutdown: viper.GetInt("MaxTimeoutGracefulShutdown"),
		Branch:                     viper.GetStringSlice("Branch"),
		Kostl:                      viper.GetStringSlice("Kostl"),
	}

	RestClient = &RestClientConfig{
		BrigateBaseUrl:     viper.GetString("BrigateBaseUrl"),
		EsbBaseUrl:         viper.GetString("EsbBaseUrl"),
		ESBMonolithBaseUrl: viper.GetString("EsbMonolithBaseUrl"),
		Timeout:            time.Duration(viper.GetInt("RestClientTO")) * time.Second,
	}

	Redis = &RedisConfig{
		Host:         viper.GetString("RedisLocal.Host"),
		Port:         viper.GetString("RedisLocal.Port"),
		Password:     viper.GetString("RedisLocal.Password"),
		Db:           viper.GetInt("RedisLocal.Db"),
		PoolSize:     viper.GetInt("RedisLocal.PoolSize"),
		MinIdleConns: viper.GetInt("RedisLocal.MinIdleConns"),
	}

	Bristars = &BristarsConfig{
		AppId:      viper.GetString("Bristars.AppId"),
		Url:        viper.GetString("Bristars.Url"),
		Username:   viper.GetString("Bristars.Username"),
		Password:   viper.GetString("Bristars.Password"),
		UseBrigate: viper.GetBool("Bristars.UseBrigate"),
	}

	EsbMonolithConf = &ESBMonolithConfig{
		ServiceID000F5: viper.GetString("EsbMonolithConf.000F5ServiceID"),
		ServiceID000FB: viper.GetString("EsbMonolithConf.000FBServiceId"),
		ServiceID000H4: viper.GetString("EsbMonolithConf.000H4ServiceId"),
		ChannelID:      viper.GetString("EsbMonolithConf.ChannelID"),
	}

	BRIGateConf = &BRIGateConfig{
		EMaterai: EMaterai{
			NoDoc:          viper.GetString("BRIgateConf.EMaterai.NoDoc"),
			EndPointUpload: viper.GetString("BRIGateConf.EMaterai.EndPointUpload"),
			TemplateCode:   viper.GetString("BRIGateConf.EMaterai.TemplateCode"),
			Check:          viper.GetBool("BRIGateConf.EMaterai.Check"),
			Kopur:          viper.GetInt("BRIGateConf.EMaterai.Kopur"),
			JenisIdentitas: viper.GetString("BRIGateConf.EMaterai.JenisIdentitas"),
		},
		Username: viper.GetString("BRIgateConf.Username"),
		Password: viper.GetString("BRIgateConf.Password"),
	}

	// Minio Setup
	minioUseSSL := false
	if viper.GetInt("Minio.UseSSL") == 1 {
		minioUseSSL = true
	}
	presignIntExp := viper.GetInt("Minio.PresignedURLExpire")
	// convert it to time.Duration in minutes
	presignExp := time.Duration(presignIntExp) * time.Minute
	Minio = &MinioConfig{
		Endpoint:                viper.GetString("Minio.Endpoint"),
		AccessKeyID:             viper.GetString("Minio.AccesKeyID"),
		SecretAccessKey:         viper.GetString("Minio.SecretKey"),
		UseSSL:                  minioUseSSL,
		BucketName:              viper.GetString("Minio.BucketName"),
		PresignedURLExpire:      presignExp,
		PPNWapuPrefixPath:       viper.GetString("Minio.PPNWapuPrefixPath"),
		DaftarPustakaPrefixPath: viper.GetString("Minio.DaftarPustakaPrefixPath"),
	}

	RestMode = new(bool)
	*RestMode = viper.GetBool("RestMode")
}

func initTimeConfig() {
	loc, err := time.LoadLocation(General.Timezone)
	if err != nil {
		panic(fmt.Sprintf("Failed to load location: %s", err.Error()))
	}

	Location = loc
	FormatTime = General.FormatTime
}
