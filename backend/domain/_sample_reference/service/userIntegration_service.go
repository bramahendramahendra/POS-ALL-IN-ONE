package service

import (
	dto "permen_api/domain/sample/dto"
	bycrypt "permen_api/pkg/bcrypt"
)

func (s *userIntegrationService) CreateUserIntegration(req *dto.CreateUserIntegrationRequest) (data dto.CreateUserIntegrationResponse, err error) {
	hashedCreds, err := bycrypt.HashPassword(req.Creds)
	if err != nil {
		return data, err
	}
	req.Creds = hashedCreds
	err = s.repo.CreateUserIntegration(req)
	if err != nil {
		return data, err
	}

	data = dto.CreateUserIntegrationResponse{
		Username: req.Username,
	}

	return data, nil
}

func (s *userIntegrationService) GetUserIntegrationByUsername(username string) (data dto.UserIntegrationResponse, err error) {
	dataDB, err := s.repo.GetUserIntegrationByUsername(username)
	if err != nil {
		return data, err
	}

	data = dto.UserIntegrationResponse{
		Username:    dataDB.Username,
		Credentials: dataDB.Credentials,
		ChannelName: dataDB.ChannelName,
		CreatedBy:   dataDB.CreatedBy,
		IsActive:    dataDB.IsActive,
	}

	return data, nil
}

func (s *userIntegrationService) GetAllUserIntegrations() (data []dto.UserIntegrationResponse, err error) {
	dataDB, err := s.repo.GetAllUserIntegrations()
	if err != nil {
		return data, err
	}

	for _, v := range dataDB {
		data = append(data, dto.UserIntegrationResponse{
			Username:    v.Username,
			Credentials: v.Credentials,
			ChannelName: v.ChannelName,
			CreatedBy:   v.CreatedBy,
			IsActive:    v.IsActive,
		})
	}

	return data, nil
}
