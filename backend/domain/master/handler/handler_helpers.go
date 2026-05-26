package handler_master

import (
	"strconv"

	"pos_api/errors"

	"github.com/gin-gonic/gin"
)

func parseMasterIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
