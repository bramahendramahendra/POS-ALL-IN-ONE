package segment

import (
	handler_payment_method "pos_api/domain/payment_method/handler"
	repo_payment_method "pos_api/domain/payment_method/repo"
	service_payment_method "pos_api/domain/payment_method/service"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func PaymentMethodRoutes(r *gin.RouterGroup) {
	repo := repo_payment_method.NewPaymentMethodRepo(pkgdatabase.DB)
	svc := service_payment_method.NewPaymentMethodService(repo)
	hand := handler_payment_method.NewPaymentMethodHandler(svc)

	g := r.Group("/payment-methods")
	{
		g.GET("", hand.GetAll)
	}
}
