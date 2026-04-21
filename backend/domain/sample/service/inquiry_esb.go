package service

import (
	config "permen_api/config"
	globalDTO "permen_api/dto"
	helper "permen_api/helper"
	transport "permen_api/pkg/transport"

	"fmt"

	"github.com/gin-gonic/gin"
)

const (
	endpointInquiryCASAVA = "/casaretrieve/1.0/mscasaretrieveinformation/getcasadetailsinformation"
)

func (s *userIntegrationService) InquiryAccountCASAVA(c *gin.Context, accountNumber string) (data globalDTO.InquryCASAVAResponse, err error) {
	usernameESB := config.EsbConf.Username
	passwordESB := config.EsbConf.Password

	headerRequest := map[string]string{
		"Authorization": "Basic " + helper.BuildBasicAuthCreds(usernameESB, passwordESB),
	}

	req := globalDTO.InquiryCASAVARequest{
		AccountNo:  accountNumber,
		ChannelId:  config.EsbConf.ChannelId,
		ServiceId:  config.EsbConf.ServiceIDInquiryCASAVA,
		Remark2:    "Sample-integration-model-perment",
		Remark3:    "Sample-integration-model-perment",
		ExternalId: helper.GenerateExternalId("perment"),
		TellerId:   "0229891",
	}

	payload := globalDTO.ESBCallBodyRequest{
		Request: req,
	}

	reqOptions := transport.RequestOptions{
		Body:        payload,
		Context:     c,
		Headers:     headerRequest,
		ContentType: "application/json",
		DbCon:       s.repo.GetDB(),
		EnableLog:   true,
		IsESB:       true,
	}

	res, _, _, err := s.esb.Post(endpointInquiryCASAVA, &reqOptions)
	if err != nil {
		return data, err
	}

	resBodyFull, err := helper.MapResponseBody[globalDTO.InquiryCasavaBodyResponse](res)
	if err != nil {
		return data, err
	}

	data = resBodyFull.Response

	if resBodyFull.Response.ResponseCode != "00" {
		return data, fmt.Errorf("ESB error : %s ", resBodyFull.Response.ResponseMessage)
	}

	return data, nil
}
