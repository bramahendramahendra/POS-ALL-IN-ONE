package service_menu

import (
	dto_menu "pos_api/domain/menu/dto"
	model_menu "pos_api/domain/menu/model"
	repo_menu "pos_api/domain/menu/repo"
	"pos_api/errors"
)

type menuService struct {
	repo repo_menu.MenuRepo
}

func NewMenuService(repo repo_menu.MenuRepo) MenuService {
	return &menuService{repo: repo}
}

func (s *menuService) GetAll(filter *dto_menu.MenuListFilter) ([]*dto_menu.MenuResponse, error) {
	menus, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_menu.MenuResponse, 0, len(menus))
	for _, m := range menus {
		result = append(result, toMenuResponse(m))
	}
	return result, nil
}

func (s *menuService) GetByID(id int) (*dto_menu.MenuResponse, error) {
	m, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if m == nil {
		return nil, &errors.NotFoundError{Message: "Menu tidak ditemukan"}
	}
	return toMenuResponse(m), nil
}

// GetMyMenus mengembalikan menu tree berdasarkan role user yang sedang login.
func (s *menuService) GetMyMenus(roleName string) ([]dto_menu.MyMenuItem, error) {
	flat, err := s.repo.GetMyMenus(roleName)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return buildTree(flat), nil
}

func (s *menuService) Create(req *dto_menu.CreateMenuRequest) (*dto_menu.MenuResponse, error) {
	existing, err := s.repo.GetByKeyName(req.KeyName)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if existing != nil {
		return nil, &errors.BadRequestError{Message: "Key menu sudah digunakan"}
	}

	// Validasi parent_id jika diisi
	if req.ParentID != nil {
		parent, err := s.repo.GetByID(*req.ParentID)
		if err != nil {
			return nil, &errors.InternalServerError{Message: err.Error()}
		}
		if parent == nil {
			return nil, &errors.BadRequestError{Message: "Parent menu tidak ditemukan"}
		}
	}

	newID, err := s.repo.Create(req)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data menu baru"}
	}
	return toMenuResponse(created), nil
}

func (s *menuService) Update(id int, req *dto_menu.UpdateMenuRequest) error {
	m, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if m == nil {
		return &errors.NotFoundError{Message: "Menu tidak ditemukan"}
	}

	// Cegah menu menjadi parent dirinya sendiri
	if req.ParentID != nil && *req.ParentID == id {
		return &errors.BadRequestError{Message: "Menu tidak bisa menjadi parent dirinya sendiri"}
	}

	if req.ParentID != nil {
		parent, err := s.repo.GetByID(*req.ParentID)
		if err != nil {
			return &errors.InternalServerError{Message: err.Error()}
		}
		if parent == nil {
			return &errors.BadRequestError{Message: "Parent menu tidak ditemukan"}
		}
	}

	if err := s.repo.Update(id, req); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *menuService) Delete(id int) error {
	m, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if m == nil {
		return &errors.NotFoundError{Message: "Menu tidak ditemukan"}
	}

	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *menuService) Reorder(req *dto_menu.ReorderRequest) error {
	if err := s.repo.Reorder(req.Items); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

// buildTree mengubah flat list menjadi nested tree berdasarkan key_name.
// Parent diidentifikasi dengan cara: item yang key_name-nya tidak mengandung '.'
// atau parent_id-nya nil adalah root. Item dengan parent_id dimasukkan ke children parent.
func buildTree(flat []*dto_menu.MyMenuItem) []dto_menu.MyMenuItem {
	// Buat map key_name → index di flat untuk pencarian cepat
	indexMap := make(map[string]int, len(flat))
	for i, item := range flat {
		indexMap[item.KeyName] = i
	}

	var roots []dto_menu.MyMenuItem
	childMap := make(map[string][]dto_menu.MyMenuItem)

	for _, item := range flat {
		// Cari parent berdasarkan konvensi key_name: "inventory.products" → parent = "inventory"
		dotIdx := lastDot(item.KeyName)
		if dotIdx == -1 {
			// Tidak ada dot → top-level
			roots = append(roots, *item)
		} else {
			parentKey := item.KeyName[:dotIdx]
			childMap[parentKey] = append(childMap[parentKey], *item)
		}
	}

	// Rekursif pasang children ke parent
	var attachChildren func(items []dto_menu.MyMenuItem) []dto_menu.MyMenuItem
	attachChildren = func(items []dto_menu.MyMenuItem) []dto_menu.MyMenuItem {
		result := make([]dto_menu.MyMenuItem, 0, len(items))
		for _, item := range items {
			if children, ok := childMap[item.KeyName]; ok {
				item.Children = attachChildren(children)
			}
			result = append(result, item)
		}
		return result
	}

	return attachChildren(roots)
}

func lastDot(s string) int {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == '.' {
			return i
		}
	}
	return -1
}

func toMenuResponse(m *model_menu.Menu) *dto_menu.MenuResponse {
	return &dto_menu.MenuResponse{
		ID:         m.ID,
		ParentID:   m.ParentID,
		KeyName:    m.KeyName,
		Label:      m.Label,
		Icon:       m.Icon,
		Path:       m.Path,
		OrderIndex: m.OrderIndex,
		IsActive:   m.IsActive,
		CreatedAt:  m.CreatedAt,
	}
}
