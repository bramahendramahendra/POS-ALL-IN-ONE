import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { formatRupiah } from '@/shared/utils'

import { useCashDrawerDetailQuery } from '../cash-drawer.api'
import type { CashDrawer } from '../cash-drawer.types'

interface CashDrawerDetailModalProps {
  cashDrawerId: number | null
  onClose: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface SummaryRowProps {
  label: string
  value: string
  valueClass?: string
}

function SummaryRow({ label, value, valueClass = '' }: SummaryRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}

export function CashDrawerDetailModal({ cashDrawerId, onClose }: CashDrawerDetailModalProps) {
  const { data, isLoading } = useCashDrawerDetailQuery(cashDrawerId)
  const detail: CashDrawer | undefined = data?.data

  return (
    <Dialog open={cashDrawerId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Kas Harian</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="py-8 text-center text-sm text-gray-400">Memuat data...</div>
        )}

        {detail && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">{formatDate(detail.date)}</span>
              {detail.status === 'closed' ? (
                <Badge variant="secondary">Tutup</Badge>
              ) : (
                <Badge variant="default">Buka</Badge>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <SummaryRow label="Saldo Awal" value={formatRupiah(detail.opening_balance)} />
              <SummaryRow
                label="Total Masuk"
                value={formatRupiah(detail.total_in)}
                valueClass="text-green-600"
              />
              <SummaryRow
                label="Total Keluar"
                value={formatRupiah(detail.total_out)}
                valueClass="text-red-600"
              />
              <SummaryRow
                label="Saldo Akhir (Aktual)"
                value={formatRupiah(detail.closing_balance)}
                valueClass="font-semibold"
              />
              <SummaryRow
                label="Saldo Akhir (Ekspektasi)"
                value={formatRupiah(detail.expected_balance)}
              />
              <SummaryRow
                label="Selisih"
                value={`${detail.difference >= 0 ? '+' : ''}${formatRupiah(detail.difference)}`}
                valueClass={
                  detail.difference === 0
                    ? 'text-gray-500'
                    : detail.difference > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                }
              />
            </div>

            {detail.status === 'closed' && (
              <div className="space-y-1 text-sm">
                {detail.closed_at && (
                  <p className="text-gray-500">
                    Ditutup:{' '}
                    <span className="text-gray-700">{formatDateTime(detail.closed_at)}</span>
                  </p>
                )}
                {detail.closed_by_name && (
                  <p className="text-gray-500">
                    Oleh: <span className="text-gray-700">{detail.closed_by_name}</span>
                  </p>
                )}
                {detail.notes && (
                  <p className="text-gray-500">
                    Catatan: <span className="text-gray-700">{detail.notes}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
