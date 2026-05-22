package service_expense

import (
	repo_cash_drawer "pos_api/domain/cash_drawer/repo"
	dto_expense "pos_api/domain/expense/dto"
	repo_expense "pos_api/domain/expense/repo"
	"pos_api/errors"
)

type expenseService struct {
	repo           repo_expense.ExpenseRepo
	cashDrawerRepo repo_cash_drawer.CashDrawerRepo
}

func NewExpenseService(repo repo_expense.ExpenseRepo, cashDrawerRepo repo_cash_drawer.CashDrawerRepo) ExpenseService {
	return &expenseService{repo: repo, cashDrawerRepo: cashDrawerRepo}
}

func (s *expenseService) GetAll(filter *dto_expense.ExpenseFilter) ([]*dto_expense.ExpenseResponse, int, error) {
	items, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return items, total, nil
}

func (s *expenseService) GetByID(id int) (*dto_expense.ExpenseResponse, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if item == nil {
		return nil, &errors.NotFoundError{Message: "Pengeluaran tidak ditemukan"}
	}
	return item, nil
}

func (s *expenseService) Create(req *dto_expense.ExpenseRequest, userID int) (*dto_expense.ExpenseResponse, error) {
	id, err := s.repo.Create(req, userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	// Jika client mengirimkan cash_drawer_id (kasus offline sync), gunakan kas tersebut.
	// Jika tidak, fallback ke kas yang sedang terbuka milik user saat ini.
	if req.CashDrawerID != nil {
		cd, _ := s.cashDrawerRepo.GetByID(*req.CashDrawerID)
		if cd != nil && cd.Status == "open" {
			_ = s.cashDrawerRepo.UpdateExpenses(cd.ID, req.Amount)
		}
	} else {
		openCashDrawer, _ := s.cashDrawerRepo.GetOpenCashDrawer(userID)
		if openCashDrawer != nil {
			_ = s.cashDrawerRepo.UpdateExpenses(openCashDrawer.ID, req.Amount)
		}
	}

	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return item, nil
}

func (s *expenseService) Update(id int, req *dto_expense.ExpenseRequest) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Pengeluaran tidak ditemukan"}
	}
	if err := s.repo.Update(id, req); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	// Perbarui total_expenses di kas dengan selisih nominal — hanya jika pengeluaran
	// berasal dari sesi kas yang sedang terbuka.
	// Kondisi: tanggal buka kas (local) <= expense_date, artinya sesi ini dibuka sebelum
	// atau pada hari yang sama dengan pengeluaran — menangani sesi overnight dengan benar.
	// Jika sesi yang lebih baru sudah dibuka (open_time > expense_date), tidak disentuh.
	delta := req.Amount - existing.Amount
	if delta != 0 {
		openCashDrawer, _ := s.cashDrawerRepo.GetOpenCashDrawer(existing.UserID)
		if openCashDrawer != nil && openCashDrawer.OpenTime.Local().Format("2006-01-02") <= existing.ExpenseDate {
			_ = s.cashDrawerRepo.UpdateExpenses(openCashDrawer.ID, delta)
		}
	}
	return nil
}

func (s *expenseService) Delete(id int) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Pengeluaran tidak ditemukan"}
	}
	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	// Kembalikan nominal ke total_expenses (kurangi) hanya jika pengeluaran berasal dari
	// sesi kas yang sedang terbuka. Gunakan <= agar sesi overnight (open_time hari N,
	// expense_date hari N+1) tetap terdeteksi sebagai satu sesi yang sama.
	openCashDrawer, _ := s.cashDrawerRepo.GetOpenCashDrawer(existing.UserID)
	if openCashDrawer != nil && openCashDrawer.OpenTime.Local().Format("2006-01-02") <= existing.ExpenseDate {
		_ = s.cashDrawerRepo.UpdateExpenses(openCashDrawer.ID, -existing.Amount)
	}
	return nil
}
