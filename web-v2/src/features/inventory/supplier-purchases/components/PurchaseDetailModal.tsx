import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatDate, formatRupiah } from '@/shared/utils'

import { useSupplierPurchaseDetailQuery, useSupplierPurchasePaymentsQuery } from '../supplier-purchases.api'
import type { PaymentStatus } from '../supplier-purchases.types'

interface PurchaseDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: number | null
}

const STATUS_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  paid:    { label: 'Lunas',          className: 'bg-green-100 text-green-700' },
  unpaid:  { label: 'Hutang',         className: 'bg-red-100 text-red-700' },
  partial: { label: 'Bayar Sebagian', className: 'bg-yellow-100 text-yellow-700' },
}

export function PurchaseDetailModal({ open, onOpenChange, purchaseId }: PurchaseDetailModalProps) {
  const enabled = open && (purchaseId ?? 0) > 0

  const { data: purchase, isLoading: loadingPurchase } = useSupplierPurchaseDetailQuery(
    enabled ? purchaseId : null,
  )
  const { data: payments, isLoading: loadingPayments } = useSupplierPurchasePaymentsQuery(
    enabled ? purchaseId : null,
  )

  const isLoading = loadingPurchase || loadingPayments
  const statusBadge = purchase
    ? (STATUS_BADGE[purchase.payment_status] ?? { label: purchase.payment_status, className: 'bg-gray-100 text-gray-600' })
    : null

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Detail Pembelian"
      size="lg"
      hideFooter
    >
      {isLoading || !purchase ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-5 text-sm">
          {/* Info Header */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoField label="Kode PO">
              <span className="font-mono font-semibold text-blue-700">{purchase.purchase_code}</span>
            </InfoField>
            <InfoField label="No. Faktur">
              <span className="font-medium">{purchase.invoice_number}</span>
            </InfoField>
            <InfoField label="Tanggal Pembelian" value={formatDate(purchase.purchase_date)} />
            <InfoField label="Supplier" value={purchase.supplier_name || '—'} />
            <InfoField label="Dicatat Oleh" value={purchase.user_name || '—'} />
            <InfoField label="Status">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge?.className}`}>
                {statusBadge?.label}
              </span>
            </InfoField>
            {purchase.notes && (
              <div className="col-span-2">
                <InfoField label="Catatan" value={purchase.notes} />
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2 border-t pt-4">
            <SummaryCard label="Subtotal" value={formatRupiah(purchase.total_amount + purchase.discount_amount)} color="gray" />
            <SummaryCard label="Diskon" value={formatRupiah(purchase.discount_amount)} color="orange" />
            <SummaryCard label="Total" value={formatRupiah(purchase.total_amount)} color="blue" />
            <SummaryCard
              label="Sisa Hutang"
              value={formatRupiah(purchase.remaining_amount)}
              color={purchase.remaining_amount > 0 ? 'red' : 'green'}
              sub={`Dibayar: ${formatRupiah(purchase.paid_amount)}`}
            />
          </div>

          {/* Tabel Item */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Item Produk
            </p>
            {!purchase.items || purchase.items.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Tidak ada item.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Produk', 'Qty', 'Satuan', 'Harga Beli', 'Subtotal'].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items.map((item, i) => (
                      <tr key={item.id ?? i} className="border-t">
                        <td className="px-2 py-1.5 font-medium">{item.product_name || `Produk #${item.product_id}`}</td>
                        <td className="px-2 py-1.5 text-gray-700">{item.quantity}</td>
                        <td className="px-2 py-1.5 text-gray-600">{item.unit}</td>
                        <td className="px-2 py-1.5">{formatRupiah(item.purchase_price)}</td>
                        <td className="px-2 py-1.5 font-medium">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Riwayat Pembayaran */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Riwayat Pembayaran
            </p>
            {!payments || payments.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Belum ada pembayaran yang dicatat.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Tanggal', 'Jumlah', 'Metode', 'Dicatat Oleh', 'Catatan'].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-2 py-1.5 text-gray-600">{formatDate(p.payment_date)}</td>
                        <td className="px-2 py-1.5 font-semibold text-green-700">{formatRupiah(p.amount)}</td>
                        <td className="px-2 py-1.5 text-gray-600 capitalize">{p.payment_method || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-600">{p.user_name || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-500">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={2} className="px-2 py-1.5 font-medium text-gray-600">Total Dibayar</td>
                      <td className="px-2 py-1.5 font-bold text-green-700">
                        {formatRupiah(payments.reduce((s, p) => s + p.amount, 0))}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t pt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </FormModal>
  )
}

function InfoField({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-500">{label}</p>
      {children ?? <p className="font-medium text-gray-800">{value ?? '—'}</p>}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color: 'gray' | 'blue' | 'red' | 'green' | 'orange'
}) {
  const colorMap = {
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
    red:    'bg-red-50 border-red-100 text-red-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
  }
  const subColorMap = {
    gray:   'text-gray-400',
    blue:   'text-blue-400',
    red:    'text-red-400',
    green:  'text-green-500',
    orange: 'text-orange-400',
  }

  return (
    <div className={`rounded-lg border p-2.5 ${colorMap[color]}`}>
      <p className="text-xs opacity-70 mb-0.5">{label}</p>
      <p className="font-semibold text-sm leading-tight">{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${subColorMap[color]}`}>{sub}</p>}
    </div>
  )
}
