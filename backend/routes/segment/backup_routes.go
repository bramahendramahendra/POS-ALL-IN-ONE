package segment

import (
	backup_handler "permen_api/domain/backup/handler"
	backup_service "permen_api/domain/backup/service"
	middleware "permen_api/middleware"

	"github.com/gin-gonic/gin"
)

func BackupRoutes(r *gin.RouterGroup) {
	backupSvc := backup_service.NewBackupService()
	backupHand := backup_handler.NewBackupHandler(backupSvc)

	g := r.Group("/backup", middleware.RoleMiddleware("owner", "admin"))
	{
		g.POST("", backupHand.Create)
		g.GET("/list", backupHand.GetList)
		g.GET("/download/:filename", backupHand.Download)
	}

	r.POST("/restore", middleware.RoleMiddleware("admin"), backupHand.Restore)
}
