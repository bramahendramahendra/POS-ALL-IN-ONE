package service_menu

import dto_menu "pos_api/domain/menu/dto"

type MenuService interface {
	GetAll(filter *dto_menu.MenuListFilter) ([]*dto_menu.MenuResponse, error)
	GetByID(id int) (*dto_menu.MenuResponse, error)
	GetMyMenus(roleName string) ([]dto_menu.MyMenuItem, error)
	Create(req *dto_menu.CreateMenuRequest) (*dto_menu.MenuResponse, error)
	Update(id int, req *dto_menu.UpdateMenuRequest) error
	Delete(id int) error
	Reorder(req *dto_menu.ReorderRequest) error
}
