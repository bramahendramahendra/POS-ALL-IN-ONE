package bootstrap

import (
	error_helper "permen_api/helper/error"
	"permen_api/pkg/database"
	"permen_api/pkg/logger"
	"permen_api/routes"
	_ "permen_api/validation"

	"permen_api/config"

	"github.com/gin-gonic/gin"
)

var (
	Engine *gin.Engine
)

func Initialized() *gin.Engine {
	InitializedDB()
	initializedLogger()

	gin.SetMode(gin.ReleaseMode)
	ginEngine := gin.Default()

	trustedProxies := []string{
		"127.0.0.1",
		"::1",
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

func initializedLogger() {
	logger.Log = logger.New()
	defer logger.Log.Sync()
}
