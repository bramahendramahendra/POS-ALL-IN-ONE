package helper

import "github.com/gin-gonic/gin"

func GetUserID(c *gin.Context) int {
	userID, _ := c.Get("user_id")
	return userID.(int)
}

func GetUserRole(c *gin.Context) string {
	role, _ := c.Get("user_role")
	return role.(string)
}

func GetDeviceInfo(c *gin.Context) string {
	device, _ := c.Get("device_info")
	return device.(string)
}
