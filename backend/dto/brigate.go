package global_dto

type (
	RequestBrigate struct {
		Request any `json:"request"`
	}

	ResponseDatahubNPWPBrigate struct {
		Response BrigateDataHub `json:"response"`
	}

	DataHubNPWPReq struct {
		Npwp       string `json:"npwp"`
		Nama       string `json:"nama"`
		ChannelId  string `json:"channelId"`
		TellerId   string `json:"tellerId"`
		ServiceId  string `json:"serviceId"`
		ExternalId string `json:"externalId"`
	}

	DataHubNPWPRes struct {
		Npwp        string `json:"npwp"`
		Npwp15      string `json:"npwp15"`
		Npwp16      string `json:"npwp16"`
		Nitku       string `json:"nitku"`
		NamaWp      string `json:"namaWp"`
		StatusAktif string `json:"statusAktif"`
		StatusPusat string `json:"statusPusat"`
	}

	BrigateDataHub struct {
		ErrorCode       string         `json:"errorCode"`
		ResponseCode    string         `json:"responseCode"`
		ResponseMessage string         `json:"responseMessage"`
		ResponseDataHub DataHolderRes  `json:"responseDataHub"`
		ResponseDJP     DataHolderRes  `json:"responseDJP"`
		ResponseData    DataHubNPWPRes `json:"responseData"`
	}

	DataHolderRes struct {
		ResponseCode    string `json:"responseCode"`
		ResponseMessage string `json:"responseMessage"`
	}

	InquiryLoanBodyReq struct {
		AccountNo  string `json:"accountNo"`
		ChannelId  string `json:"channelId"`
		ServiceId  string `json:"serviceId"`
		TellerId   string `json:"tellerId"`
		Remark2    string `json:"remark2"`
		Remark3    string `json:"remark3"`
		ExternalId string `json:"externalId"`
	}

	InquiryLoanBodyRes struct {
		Response InquiryLoanResponse `json:"response"`
	}

	InquiryLoanResponse struct {
		ErrorCode           string `json:"errorCode"`
		ResponseCode        string `json:"responseCode"`
		ResponseMessage     string `json:"responseMessage"`
		Remark2             string `json:"remark2"`
		Remark3             string `json:"remark3"`
		AcctNo              string `json:"acctNo"`
		CustName            string `json:"custName"`
		AcctCurr            string `json:"acctCurr"`
		BillingAmt          string `json:"billingAmt"`
		PrincipleAmt        string `json:"principleAmt"`
		PrincipleAmtNew     string `json:"principleAmtNew"`
		OtherChargeAmt      string `json:"otherChargeAmt"`
		MiscCost            string `json:"miscCost"`
		InterestAmt         string `json:"interestAmt"`
		LateChargeAmt       string `json:"lateChargeAmt"`
		RepaymentAmt        string `json:"repaymentAmt"`
		ProvinsiPercentage  string `json:"provinsiPercentage"`
		InsurancePercentage string `json:"insurancePercentage"`
		Status              string `json:"status"`
		LoanTypeDigital     string `json:"loanTypeDigital"`
		DrawLimit           string `json:"drawLimit"`
		ReleaseAmt          string `json:"releaseAmt"`
		LoanType            string `json:"loanType"`
		Cif                 string `json:"cif"`
		FirstReleaseDate    string `json:"firstReleaseDate"`
		Balance             string `json:"balance"`
		DueDate             string `json:"dueDate"`
		OriBranch           string `json:"oriBranch"`
		WithDrawalBalance   string `json:"withDrawalBalance"`
	}

	UploadDocumentAsyncReq struct {
		Content        string `json:"content"` // Base64 encoded content
		FileName       string `json:"filename"`
		TemplateCode   string `json:"templateCode"`
		NoDoc          string `json:"noDoc"`
		TglDoc         string `json:"tglDoc"`
		Kopur          int    `json:"kopur"`
		JenisIdentitas string `json:"jenisIdentitas"`
		NoIdentitas    string `json:"noIdentitas"`
		NamaIdentitas  string `json:"namaIdentitas"`
		CallbackUrl    string `json:"callbackUrl"`
		Reference      string `json:"reference"`
	}

	UploadDocumentAsyncResp struct {
		ResponseCode     string `json:"responseCode"`
		ResponseMessage  string `json:"responseMessage"`
		NoDoc            string `json:"noDoc"`
		ID               string `json:"id"`
		Name             string `json:"name"`
		Status           string `json:"status"`
		Message          string `json:"message"`
		TypeDoc          string `json:"typeDoc"`
		DateDoc          string `json:"dateDoc"`
		SN               string `json:"sn"`
		CreatedBy        string `json:"createdBy"`
		CreatedDate      string `json:"createdDate"`
		LastModifiedBy   string `json:"lastModifiedBy"`
		LastModifiedDate string `json:"lastModifiedDate"`
		Checksum         string `json:"checksum"`
	}
)
