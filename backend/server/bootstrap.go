package bootstrap

import (
	"permen_api/config"
	error_helper "permen_api/helper/error"
	"permen_api/pkg/database"
	"permen_api/pkg/logger"
	minio "permen_api/pkg/minio"
	"permen_api/pkg/redis"
	"permen_api/pkg/transport"
	"permen_api/routes"
	_ "permen_api/validation"

	"github.com/gin-gonic/gin"
)

var (
	Engine *gin.Engine
)

func Initialized() *gin.Engine {
	InitializedDB()
	// initializedRedis()
	initializedLogger()
	initializedMinio()
	initializedRestClient()

	gin.SetMode(gin.ReleaseMode)
	ginEngine := gin.Default()

	// Security: Configure trusted proxies instead of trusting all proxies by default
	// Using CIDR notation for network ranges
	trustedProxies := []string{
		"127.0.0.1", // localhost
		"::1",       // IPv6 localhost
		// "172.18.0.0/16", // Allow entire 172.18.x.x subnet
		// Add other trusted network ranges here if needed
		// "10.0.0.0/8",     // Private network range (if using internal load balancer)
		// "192.168.0.0/16", // Private network range
	}

	if err := ginEngine.SetTrustedProxies(trustedProxies); err != nil {
		errData := error_helper.SetError(nil, "Proxy Configuration", err.Error(), error_helper.GetStackTrace(1), nil)
		panic(errData)
	}

	routes.Router(ginEngine)
	return ginEngine
}

func InitializedDB() {
	dbManager := database.New()
	database.DbManager = dbManager
	err := dbManager.Register(config.Db.Database, config.Db)
	if err != nil {
		errData := error_helper.SetError(nil, "DB Initialization", err.Error(), error_helper.GetStackTrace(1), nil)
		panic(errData)
	}

	database.DB = dbManager.GetDatabase(config.Db.Database)
}

func initializedRedis() {
	redisName := "Redis"
	redisManager := redis.New()
	if err := redisManager.Register(redisName, config.Redis); err != nil {
		errData := error_helper.SetError(nil, "Redis Initialization", err.Error(), error_helper.GetStackTrace(1), nil)
		panic(errData)
	}
	redis.Client = redisManager.GetRedis(redisName)
}

func initializedLogger() {
	logger.Log = logger.New()
	defer logger.Log.Sync()
}

func initializedMinio() {
	err := minio.New(config.Minio)
	if err != nil {
		errData := error_helper.SetError(nil, "Minio Initialization", err.Error(), error_helper.GetStackTrace(1), nil)
		panic(errData)
	}
}

func initializedRestClient() {
	transport.BrigateRestClient = transport.NewRestClient(config.RestClient.BrigateBaseUrl, config.RestClient.Timeout)
	transport.EsbRestClient = transport.NewRestClient(config.RestClient.EsbBaseUrl, config.RestClient.Timeout)
	transport.ESBMonolithRestClient = transport.NewRestClient(config.RestClient.ESBMonolithBaseUrl, config.RestClient.Timeout)
}
