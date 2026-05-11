package repo_transaction

import (
	dto_transaction "pos_api/domain/transaction/dto"
	model_transaction "pos_api/domain/transaction/model"
)

type TransactionRepo interface {
	GetAll(filter *dto_transaction.TransactionFilter) ([]*dto_transaction.TransactionResponse, int, error)
	GetByID(id int) (*dto_transaction.TransactionResponse, error)
	Create(req *dto_transaction.CreateTransactionRequest, userID int) (*dto_transaction.CreateTransactionResponse, error)
	Void(id, userID int) error
	GetItems(transactionID int) ([]model_transaction.TransactionItem, error)
	// UpdateFromSync menerapkan data desktop (approve) ke tabel transactions
	UpdateFromSync(id int, data map[string]interface{}) error
	// ReturnStockForRejectSync mengembalikan stok semua item transaksi yang ditolak
	// dan mencatat setiap pengembalian sebagai mutasi REJECT_SYNC untuk audit trail
	ReturnStockForRejectSync(transactionID, resolvedBy int) error
	// ApplySyncTransaction menerapkan transaksi offline dari desktop secara atomik.
	// Menggunakan SELECT FOR UPDATE untuk cek stok, insert transaksi, kurangi stok, dan catat mutasi SALE.
	// Mengembalikan serverID transaksi baru dan error (error berisi "stok produk" jika stok tidak cukup).
	ApplySyncTransaction(payload string, localID string) (int, error)
}
