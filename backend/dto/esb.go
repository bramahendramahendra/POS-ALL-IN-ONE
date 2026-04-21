package global_dto

type (
	ESBCallBodyRequest struct {
		Request any `json:"request"`
	}

	FundTransferBodyResponse struct {
		Response FundTransferResponse `json:"response"`
	}

	InquiryCasavaBodyResponse struct {
		Response InquryCASAVAResponse `json:"response"`
	}

	InquiryGLBodyResponse struct {
		Response InquiryGLResponse `json:"response"`
	}

	InquiryCASAVARequest struct {
		AccountNo  string `json:"accountNo"`
		ChannelId  string `json:"channelId"`
		ServiceId  string `json:"serviceId"`
		ExternalId string `json:"externalId"`
		Remark2    string `json:"remark2"`
		Remark3    string `json:"remark3"`
		TellerId   string `json:"tellerId"`
	}

	InquryCASAVAResponse struct {
		ErrorCode        string `json:"errorCode"`
		ResponseCode     string `json:"responseCode"`
		ResponseMessage  string `json:"responseMessage"`
		AccountName      string `json:"accountName"`
		CurrencyCode     string `json:"currencyCode"`
		LedgerBalance    string `json:"ledgerBalance"`
		AvailableBalance string `json:"availableBalance"`
		MinimumBalance   string `json:"minimumBalance"`
		HoldAmount       string `json:"holdAmount"`
		Status           string `json:"status"`
		ProductCode      string `json:"productCode"`
		AccountType      string `json:"accountType"`
		CifNumber        string `json:"cifNumber"`
		IdNumber         string `json:"idNumber"`
		Branch           string `json:"branch"`
		MinimumAccrue    string `json:"minimumAccrue"`
	}

	InquiryGLRequest struct {
		AccountNumber string `json:"accountNumber"`
		ChannelID     string `json:"channelId"`
		ServiceID     string `json:"serviceId"`
		ExternalID    string `json:"externalId"`
		TerminalId    string `json:"terminalId"`
		TellerId      string `json:"tellerId"`
	}

	InquiryGLResponse struct {
		AccountNumber   string `json:"accountNumber"`
		ErrorCode       string `json:"errorCode"`
		ResponseCode    string `json:"responseCode"`
		ResponseMessage string `json:"responseMessage"`
		Currency        string `json:"currency"`
		Description     string `json:"description"`
	}

	FundTransferRequest struct {
		DebitAccount  string `json:"debitAccount"`
		CreditAccount string `json:"creditAccount"`
		Amount        string `json:"amount"`
		Remark2       string `json:"remark2"`
		Remark3       string `json:"remark3"`
		ChannelID     string `json:"channelId"`
		ServiceID     string `json:"serviceId"`
		UserName      string `json:"userName,omitempty"`
		ExternalID    string `json:"externalId"`
		TellerId      string `json:"tellerId"`
	}

	FundTransferResponse struct {
		JournalSequence string `json:"journalSequence"`
		ErrorCode       string `json:"errorCode"`
		ResponseCode    string `json:"responseCode"`
		ResponseMessage string `json:"responseMessage"`
	}
)
