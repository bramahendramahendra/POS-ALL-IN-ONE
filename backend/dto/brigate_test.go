package global_dto

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestRequestBrigate(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := RequestBrigate{
			Request: map[string]string{"key": "value"},
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded RequestBrigate
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		decodedMap, ok := decoded.Request.(map[string]interface{})
		if !ok {
			t.Fatal("expected Request to be a map")
		}
		if decodedMap["key"] != "value" {
			t.Errorf("expected key=value, got %v", decodedMap["key"])
		}
	})

	t.Run("json field name", func(t *testing.T) {
		req := RequestBrigate{Request: "test"}
		data, _ := json.Marshal(req)

		if string(data) != `{"request":"test"}` {
			t.Errorf("unexpected JSON: %s", data)
		}
	})
}

func TestDataHubNPWPReq(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := DataHubNPWPReq{
			Npwp:       "123456789012345",
			Nama:       "John Doe",
			ChannelId:  "CHANNEL001",
			TellerId:   "TELLER001",
			ServiceId:  "SERVICE001",
			ExternalId: "EXT001",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded DataHubNPWPReq
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Npwp != req.Npwp {
			t.Errorf("Npwp mismatch: got %v, want %v", decoded.Npwp, req.Npwp)
		}
		if decoded.Nama != req.Nama {
			t.Errorf("Nama mismatch: got %v, want %v", decoded.Nama, req.Nama)
		}
	})

	t.Run("json field names", func(t *testing.T) {
		req := DataHubNPWPReq{Npwp: "123", Nama: "Test"}
		data, _ := json.Marshal(req)

		var m map[string]interface{}
		json.Unmarshal(data, &m)

		expectedFields := []string{"npwp", "nama", "channelId", "tellerId", "serviceId", "externalId"}
		for _, field := range expectedFields {
			if _, ok := m[field]; !ok {
				t.Errorf("expected '%s' field in JSON", field)
			}
		}
	})
}

func TestDataHubNPWPRes(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		res := DataHubNPWPRes{
			Npwp:        "123456789012345",
			Npwp15:      "123456789012345",
			Npwp16:      "1234567890123456",
			Nitku:       "NITKU001",
			NamaWp:      "John Doe",
			StatusAktif: "AKTIF",
			StatusPusat: "PUSAT",
		}

		data, err := json.Marshal(res)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded DataHubNPWPRes
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Npwp15 != res.Npwp15 {
			t.Errorf("Npwp15 mismatch: got %v, want %v", decoded.Npwp15, res.Npwp15)
		}
		if decoded.StatusAktif != res.StatusAktif {
			t.Errorf("StatusAktif mismatch: got %v, want %v", decoded.StatusAktif, res.StatusAktif)
		}
	})
}

func TestDataHolderRes(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		res := DataHolderRes{
			ResponseCode:    "00",
			ResponseMessage: "Success",
		}

		data, err := json.Marshal(res)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded DataHolderRes
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.ResponseCode != res.ResponseCode {
			t.Errorf("ResponseCode mismatch: got %v, want %v", decoded.ResponseCode, res.ResponseCode)
		}
	})
}

func TestBrigateDataHub(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		res := BrigateDataHub{
			ErrorCode:       "0",
			ResponseCode:    "00",
			ResponseMessage: "Success",
			ResponseDataHub: DataHolderRes{
				ResponseCode:    "00",
				ResponseMessage: "DataHub Success",
			},
			ResponseDJP: DataHolderRes{
				ResponseCode:    "00",
				ResponseMessage: "DJP Success",
			},
			ResponseData: DataHubNPWPRes{
				Npwp:   "123456789012345",
				NamaWp: "John Doe",
			},
		}

		data, err := json.Marshal(res)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded BrigateDataHub
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.ResponseDataHub.ResponseCode != "00" {
			t.Errorf("ResponseDataHub.ResponseCode mismatch: got %v, want 00", decoded.ResponseDataHub.ResponseCode)
		}
		if decoded.ResponseData.NamaWp != "John Doe" {
			t.Errorf("ResponseData.NamaWp mismatch: got %v, want John Doe", decoded.ResponseData.NamaWp)
		}
	})
}

func TestResponseDatahubNPWPBrigate(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := ResponseDatahubNPWPBrigate{
			Response: BrigateDataHub{
				ResponseCode:    "00",
				ResponseMessage: "Success",
			},
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded ResponseDatahubNPWPBrigate
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Response.ResponseCode != "00" {
			t.Errorf("Response.ResponseCode mismatch: got %v, want 00", decoded.Response.ResponseCode)
		}
	})
}

func TestInquiryLoanBodyReq(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := InquiryLoanBodyReq{
			AccountNo:  "LOAN123456",
			ChannelId:  "CHANNEL001",
			ServiceId:  "SERVICE001",
			TellerId:   "TELLER001",
			Remark2:    "remark2",
			Remark3:    "remark3",
			ExternalId: "EXT001",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryLoanBodyReq
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.AccountNo != req.AccountNo {
			t.Errorf("AccountNo mismatch: got %v, want %v", decoded.AccountNo, req.AccountNo)
		}
	})
}

func TestInquiryLoanResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := InquiryLoanResponse{
			ErrorCode:           "0",
			ResponseCode:        "00",
			ResponseMessage:     "Success",
			Remark2:             "remark2",
			Remark3:             "remark3",
			AcctNo:              "LOAN123456",
			CustName:            "John Doe",
			AcctCurr:            "IDR",
			BillingAmt:          "1000000",
			PrincipleAmt:        "500000",
			PrincipleAmtNew:     "500000",
			OtherChargeAmt:      "50000",
			MiscCost:            "10000",
			InterestAmt:         "100000",
			LateChargeAmt:       "0",
			RepaymentAmt:        "660000",
			ProvinsiPercentage:  "0.5",
			InsurancePercentage: "0.1",
			Status:              "ACTIVE",
			LoanTypeDigital:     "DIGITAL",
			DrawLimit:           "10000000",
			ReleaseAmt:          "5000000",
			LoanType:            "KPR",
			Cif:                 "CIF001",
			FirstReleaseDate:    "2024-01-01",
			Balance:             "4500000",
			DueDate:             "2024-12-31",
			OriBranch:           "BRANCH001",
			WithDrawalBalance:   "500000",
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryLoanResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.CustName != resp.CustName {
			t.Errorf("CustName mismatch: got %v, want %v", decoded.CustName, resp.CustName)
		}
		if decoded.LoanType != resp.LoanType {
			t.Errorf("LoanType mismatch: got %v, want %v", decoded.LoanType, resp.LoanType)
		}
	})
}

func TestInquiryLoanBodyRes(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := InquiryLoanBodyRes{
			Response: InquiryLoanResponse{
				ResponseCode:    "00",
				ResponseMessage: "Success",
				CustName:        "John Doe",
			},
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryLoanBodyRes
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Response.CustName != "John Doe" {
			t.Errorf("Response.CustName mismatch: got %v, want John Doe", decoded.Response.CustName)
		}
	})
}

func TestUploadDocumentAsyncReq(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := UploadDocumentAsyncReq{
			Content:        "SGVsbG8gV29ybGQ=",
			FileName:       "test.pdf",
			TemplateCode:   "TEMPLATE001",
			NoDoc:          "DOC001",
			TglDoc:         "2024-01-01",
			Kopur:          1,
			JenisIdentitas: "KTP",
			NoIdentitas:    "1234567890123456",
			NamaIdentitas:  "John Doe",
			CallbackUrl:    "https://example.com/callback",
			Reference:      "REF001",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded UploadDocumentAsyncReq
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.FileName != req.FileName {
			t.Errorf("FileName mismatch: got %v, want %v", decoded.FileName, req.FileName)
		}
		if decoded.Kopur != req.Kopur {
			t.Errorf("Kopur mismatch: got %v, want %v", decoded.Kopur, req.Kopur)
		}
	})

	t.Run("kopur is integer in json", func(t *testing.T) {
		req := UploadDocumentAsyncReq{Kopur: 5}
		data, _ := json.Marshal(req)

		if !strings.Contains(string(data), `"kopur":5`) {
			t.Errorf("expected kopur to be integer in JSON, got: %s", data)
		}
	})
}

func TestUploadDocumentAsyncResp(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := UploadDocumentAsyncResp{
			ResponseCode:     "00",
			ResponseMessage:  "Success",
			NoDoc:            "DOC001",
			ID:               "ID001",
			Name:             "test.pdf",
			Status:           "UPLOADED",
			Message:          "Document uploaded successfully",
			TypeDoc:          "PDF",
			DateDoc:          "2024-01-01",
			SN:               "SN001",
			CreatedBy:        "system",
			CreatedDate:      "2024-01-01T00:00:00Z",
			LastModifiedBy:   "system",
			LastModifiedDate: "2024-01-01T00:00:00Z",
			Checksum:         "abc123def456",
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded UploadDocumentAsyncResp
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.ID != resp.ID {
			t.Errorf("ID mismatch: got %v, want %v", decoded.ID, resp.ID)
		}
		if decoded.Checksum != resp.Checksum {
			t.Errorf("Checksum mismatch: got %v, want %v", decoded.Checksum, resp.Checksum)
		}
	})

	t.Run("json field names", func(t *testing.T) {
		resp := UploadDocumentAsyncResp{
			ResponseCode: "00",
			TypeDoc:      "PDF",
		}
		data, _ := json.Marshal(resp)

		var m map[string]interface{}
		json.Unmarshal(data, &m)

		expectedFields := []string{"responseCode", "typeDoc"}
		for _, field := range expectedFields {
			if _, ok := m[field]; !ok {
				t.Errorf("expected '%s' field in JSON", field)
			}
		}
	})
}

func TestEmptyBrigateStructs(t *testing.T) {
	t.Run("empty RequestBrigate", func(t *testing.T) {
		req := RequestBrigate{}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal empty struct: %v", err)
		}
		if string(data) != `{"request":null}` {
			t.Errorf("unexpected JSON for empty struct: %s", data)
		}
	})

	t.Run("empty DataHubNPWPReq", func(t *testing.T) {
		req := DataHubNPWPReq{}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal empty struct: %v", err)
		}
		var decoded DataHubNPWPReq
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
	})
}
