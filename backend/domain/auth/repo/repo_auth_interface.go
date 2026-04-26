package repo_auth

import model_auth "permen_api/domain/auth/model"

type AuthRepo interface {
	GetUserByUsername(username string) (*model_auth.User, error)
	GetUserByID(id int) (*model_auth.User, error)
	CreateSession(session *model_auth.Session) error
	GetSessionByToken(token string) (*model_auth.Session, error)
	GetSessionByRefreshToken(token string) (*model_auth.Session, error)
	DeleteSessionByUserID(userID int) error
	DeleteSessionByToken(token string) error
}
