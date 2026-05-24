package repo_menu

import (
	dto_menu "pos_api/domain/menu/dto"
	model_menu "pos_api/domain/menu/model"
)

type MenuRepo interface {
	GetAll(filter *dto_menu.MenuListFilter) ([]*model_menu.Menu, error)
	GetByID(id int) (*model_menu.Menu, error)
	GetByKeyName(keyName string) (*model_menu.Menu, error)
	GetMyMenus(roleName string) ([]*dto_menu.MyMenuItem, error)
	Create(req *dto_menu.CreateMenuRequest) (int64, error)
	Update(id int, req *dto_menu.UpdateMenuRequest) error
	Delete(id int) error
	Reorder(items []dto_menu.ReorderItem) error
}
