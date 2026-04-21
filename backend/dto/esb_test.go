package global_dto

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestESBCallBodyRequest(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := ESBCallBodyRequest{
			Request: map[string]string{"key": "value"},
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded ESBCallBodyRequest
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
		req := ESBCallBodyRequest{Request: "test"}
		data, _ := json.Marshal(req)

		if string(data) != `{"request":"test"}` {
			t.Errorf("unexpected JSON: %s", data)
		}
	})
}

func TestInquiryCASAVARequest(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := InquiryCASAVARequest{
			AccountNo:  "1234567890",
			ChannelId:  "CHANNEL001",
			ServiceId:  "SERVICE001",
			ExternalId: "EXT001",
			Remark2:    "remark2",
			Remark3:    "remark3",
			TellerId:   "TELLER001",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryCASAVARequest
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.AccountNo != req.AccountNo {
			t.Errorf("AccountNo mismatch: got %v, want %v", decoded.AccountNo, req.AccountNo)
		}
		if decoded.ChannelId != req.ChannelId {
			t.Errorf("ChannelId mismatch: got %v, want %v", decoded.ChannelId, req.ChannelId)
		}
	})

	t.Run("json field names", func(t *testing.T) {
		req := InquiryCASAVARequest{AccountNo: "123"}
		data, _ := json.Marshal(req)

		var m map[string]interface{}
		json.Unmarshal(data, &m)

		if _, ok := m["accountNo"]; !ok {
			t.Error("expected 'accountNo' field in JSON")
		}
	})
}

func TestInquryCASAVAResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := InquryCASAVAResponse{
			ErrorCode:        "0",
			ResponseCode:     "00",
			ResponseMessage:  "Success",
			AccountName:      "John Doe",
			CurrencyCode:     "IDR",
			LedgerBalance:    "1000000",
			AvailableBalance: "900000",
			MinimumBalance:   "50000",
			HoldAmount:       "100000",
			Status:           "ACTIVE",
			ProductCode:      "PROD001",
			AccountType:      "SAVINGS",
			CifNumber:        "CIF001",
			IdNumber:         "ID001",
			Branch:           "BRANCH001",
			MinimumAccrue:    "10000",
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquryCASAVAResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.AccountName != resp.AccountName {
			t.Errorf("AccountName mismatch: got %v, want %v", decoded.AccountName, resp.AccountName)
		}
	})
}

func TestInquiryCasavaBodyResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := InquiryCasavaBodyResponse{
			Response: InquryCASAVAResponse{
				ResponseCode:    "00",
				ResponseMessage: "Success",
			},
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryCasavaBodyResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Response.ResponseCode != "00" {
			t.Errorf("ResponseCode mismatch: got %v, want 00", decoded.Response.ResponseCode)
		}
	})
}

func TestInquiryGLRequest(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := InquiryGLRequest{
			AccountNumber: "GL123456",
			ChannelID:     "CHANNEL001",
			ServiceID:     "SERVICE001",
			ExternalID:    "EXT001",
			TerminalId:    "TERM001",
			TellerId:      "TELLER001",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryGLRequest
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.AccountNumber != req.AccountNumber {
			t.Errorf("AccountNumber mismatch: got %v, want %v", decoded.AccountNumber, req.AccountNumber)
		}
	})
}

func TestInquiryGLResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := InquiryGLResponse{
			AccountNumber:   "GL123456",
			ErrorCode:       "0",
			ResponseCode:    "00",
			ResponseMessage: "Success",
			Currency:        "IDR",
			Description:     "General Ledger Account",
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryGLResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Description != resp.Description {
			t.Errorf("Description mismatch: got %v, want %v", decoded.Description, resp.Description)
		}
	})
}

func TestInquiryGLBodyResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := InquiryGLBodyResponse{
			Response: InquiryGLResponse{
				ResponseCode:    "00",
				ResponseMessage: "Success",
			},
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded InquiryGLBodyResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Response.ResponseCode != "00" {
			t.Errorf("ResponseCode mismatch: got %v, want 00", decoded.Response.ResponseCode)
		}
	})
}

func TestFundTransferRequest(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		req := FundTransferRequest{
			DebitAccount:  "1234567890",
			CreditAccount: "0987654321",
			Amount:        "1000000",
			Remark2:       "Transfer remark",
			Remark3:       "Additional remark",
			ChannelID:     "CHANNEL001",
			ServiceID:     "SERVICE001",
			UserName:      "testuser",
			ExternalID:    "EXT001",
			TellerId:      "TELLER001",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded FundTransferRequest
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.DebitAccount != req.DebitAccount {
			t.Errorf("DebitAccount mismatch: got %v, want %v", decoded.DebitAccount, req.DebitAccount)
		}
	})

	t.Run("omitempty for UserName", func(t *testing.T) {
		req := FundTransferRequest{
			DebitAccount:  "123",
			CreditAccount: "456",
		}

		data, err := json.Marshal(req)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		if strings.Contains(string(data), "userName") {
			t.Error("expected userName to be omitted when empty")
		}
	})
}

func TestFundTransferResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := FundTransferResponse{
			JournalSequence: "JRN001",
			ErrorCode:       "0",
			ResponseCode:    "00",
			ResponseMessage: "Transfer successful",
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded FundTransferResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.JournalSequence != resp.JournalSequence {
			t.Errorf("JournalSequence mismatch: got %v, want %v", decoded.JournalSequence, resp.JournalSequence)
		}
	})
}

func TestFundTransferBodyResponse(t *testing.T) {
	t.Run("marshal and unmarshal", func(t *testing.T) {
		resp := FundTransferBodyResponse{
			Response: FundTransferResponse{
				ResponseCode:    "00",
				ResponseMessage: "Success",
			},
		}

		data, err := json.Marshal(resp)
		if err != nil {
			t.Fatalf("failed to marshal: %v", err)
		}

		var decoded FundTransferBodyResponse
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if decoded.Response.ResponseCode != "00" {
			t.Errorf("ResponseCode mismatch: got %v, want 00", decoded.Response.ResponseCode)
		}
	})
}
