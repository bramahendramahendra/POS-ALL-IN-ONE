package segment

import (
	handler_payment_status "pos_api/domain/payment_status/handler"
	repo_payment_status "pos_api/domain/payment_status/repo"
	service_payment_status "pos_api/domain/payment_status/service"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func PaymentStatusRoutes(r *gin.RouterGroup) {
	repo := repo_payment_status.NewPaymentStatusRepo(pkgdatabase.DB)
	svc := service_payment_status.NewPaymentStatusService(repo)
	hand := handler_payment_status.NewPaymentStatusHandler(svc)

	g := r.Group("/payment-statuses")
	{
		g.GET("", hand.GetAll)
	}
}
