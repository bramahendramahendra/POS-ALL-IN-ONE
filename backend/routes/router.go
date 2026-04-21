package routes

import (
	"permen_api/config"
	"permen_api/errors"
	error_helper "permen_api/helper/error"
	log_helper "permen_api/helper/log"
	"permen_api/middleware"
	"permen_api/pkg/database"
	"permen_api/repository"

	"log"

	"github.com/gin-gonic/gin"
)

const (
	colorGreen  = "\033[32m"
	colorBlue   = "\033[34m"
	colorPurple = "\033[35m"
	colorReset  = "\033[0m"
	colorWhite  = "\033[37m"
)

func Router(r *gin.Engine) {
	repository.LogRequestRepo = repository.NewLogRequestRepository(database.DB)
	// Security: Add security headers first (including HSTS)
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.Cors(config.Cfg.CorsAllowOrigins))
	r.Use(middleware.LogRequestMiddleware())
	r.Use(middleware.ErrorHandlerMiddleware())
	r.NoRoute(notFoundHandler)
	r.NoMethod(methodNotAllowedHandler)

	api := r.Group("/api")
	publicRoutes(api)
	protectedRoutes(api)
}

func notFoundHandler(c *gin.Context) {
	errMessage := "Route not found"
	log_helper.SetLog(c, "warn", "not found handler", "Endpoint not found", error_helper.GetStackTrace(1), nil)
	c.Error(&errors.BadRequestError{Message: errMessage})
}

func methodNotAllowedHandler(c *gin.Context) {
	errMessage := "Method not allowed"
	log_helper.SetLog(c, "warn", "method not allowed handler", errMessage, error_helper.GetStackTrace(1), nil)
	c.Error(&errors.MethodNotAllowedError{Message: errMessage})
}

func PrintRoutes(engine *gin.Engine, port string) {
	log.Printf("%sServer running on port%s %s\n", colorWhite, colorReset, port)
	log.Printf("%sRoutes:%s\n", colorWhite, colorReset)

	maxMethodLen := 0
	maxPathLen := 0
	for _, route := range engine.Routes() {
		if len(route.Method) > maxMethodLen {
			maxMethodLen = len(route.Method)
		}
		if len(route.Path) > maxPathLen {
			maxPathLen = len(route.Path)
		}
	}

	for _, route := range engine.Routes() {
		log.Printf("%s%-*s%s   %s%-*s%s   %s%s%s\n",
			colorGreen, maxMethodLen, route.Method, colorReset,
			colorBlue, maxPathLen, route.Path, colorReset,
			colorWhite, route.Handler, colorReset,
		)
	}
}
