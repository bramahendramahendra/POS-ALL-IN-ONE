package jwt

import (
	"fmt"
	"permen_api/config"
	"permen_api/errors"
	"permen_api/helper"
	time_helper "permen_api/helper/time"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	claims                 *jwt.MapClaims
	invalidTokenErrMessage = "Invalid token"
	expiredTokenErrMessage = "Token expired"

	rulesVerficationMap = map[string][]string{
		"pernr":                  {"pernr", "pernr"},
		"nama":                   {"nama", "nama"},
		"personalArea":           {"personalArea", "area"},
		"descPersonalArea":       {"descPersonalArea", "descArea"},
		"personalSubarea":        {"personalSubarea", "subArea"},
		"descPersonalSubarea":    {"descPersonalSubarea", "descSubarea"},
		"costCenter":             {"costCenter", "costCenter"},
		"descCostCenter":         {"descCostCenter", "descCostCenter"},
		"orgeh":                  {"organisasiUnit", "orgUnit"},
		"descOrganisasiUnit":     {"descOrganisasiUnit", "descOrgUnit"},
		"stell":                  {"stell", "jabatan"},
		"stellTX":                {"stellTX", "descJabatan"},
		"jgpg":                   {"jgpg", "jgpg"},
		"hilfm":                  {"hilfm", "groupJabatan"},
		"htext":                  {"htext", "descGroupJabatan"},
		"branch":                 {"branchCode", "branch"},
		"jenkel":                 {"jenkel", "jenisKelamin"},
		"personalAreaPGS":        {"personalAreaPGS", "areaPgs"},
		"descPersonalAreaPGS":    {"descPersonalAreaPGS", "descAreaPgs"},
		"personalSubareaPGS":     {"personalSubareaPGS", "subAreaPgs"},
		"descPersonalSubareaPGS": {"descPersonalSubareaPGS", "descSubAreaPgs"},
		"costCenterPGS":          {"costCenterPGS", "costCenterPgs"},
		"descCostCenterPGS":      {"descCostCenterPGS", "descCostCenterPgs"},
		"organisasiUnitPGS":      {"organisasiUnitPGS", "orgUnitPgs"},
		"descOrganisasiUnitPGS":  {"descOrganisasiUnitPGS", "descOrgUnitPgs"},
		"hilfmPGS":               {"hilfmPGS", "groupJabatanPgs"},
		"branchCodePGS":          {"branchCodePGS", "branchPgs"},
		"htextPGS":               {"htextPGS", "descGroupJabatanPgs"},
		"tipePekerja":            {"tipePekerja", "tipePekerja"},
	}
)

func CreateClaims(data map[string]any) {
	jwtClaims := jwt.MapClaims{}
	for key, value := range data {
		jwtClaims[key] = value
	}

	// jwtClaims["exp"] = time_helper.GetTimeNow().Add(time.Hour * 2).Unix()
	expireDuration := config.General.TokenExpire
	jwtClaims["exp"] = time_helper.GetTimeNow().Add(time.Second * time.Duration(expireDuration)).Unix()
	claims = &jwtClaims
}

func GenerateToken() (string, error) {
	secretKey, err := helper.GetSecretKey()
	if err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func VerifyToken(tokenString string) (*jwt.MapClaims, error) {
	secretKey, err := helper.GetSecretKey()
	if err != nil {
		return nil, err
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(secretKey), nil
	})
	if err != nil {
		var errMessage string
		if strings.Contains(err.Error(), "expired") {
			errMessage = expiredTokenErrMessage
		} else {
			errMessage = invalidTokenErrMessage
		}
		return nil, &errors.UnauthenticatedError{Message: errMessage}
	}
	if !token.Valid {
		return nil, &errors.UnauthenticatedError{Message: invalidTokenErrMessage}
	}

	jwtClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, &errors.UnauthenticatedError{Message: invalidTokenErrMessage}
	}

	expUnix, ok := jwtClaims["exp"].(float64)
	if !ok {
		return nil, &errors.UnauthenticatedError{Message: invalidTokenErrMessage}
	}
	expTime := time.Unix(int64(expUnix), 0)
	if time_helper.GetTimeNow().After(expTime) {
		return nil, &errors.UnauthenticatedError{Message: expiredTokenErrMessage}
	}

	return &jwtClaims, nil
}

func FillResultMapFromClaims(claims jwt.MapClaims) map[string]string {
	result := make(map[string]string)
	for resultKey, candidates := range rulesVerficationMap {
		for _, claimKey := range candidates {
			if val, ok := claims[claimKey]; ok && val != nil {
				strVal := fmt.Sprintf("%v", val) // safe conversion of many claim types
				if strVal != "" {
					result[resultKey] = strVal
					break
				}
			}
		}
	}
	return result
}
