import { FormModal, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatDate, formatRupiah } from '@/shared/utils'

import { useSupplierDetailQuery } from '../suppliers.api'

interface SupplierDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId?: number
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Lunas',
  unpaid: 'Hutang',
  partial: 'Bayar Sebagian',
}

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
}

export function SupplierDetailModal({ open, onOpenChange, supplierId }: SupplierDetailModalProps) {
  const enabled = open && (supplierId ?? 0) > 0
  const { data: supplier, isLoading } = useSupplierDetailQuery(enabled ? (supplierId as number) : 0)

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Detail Supplier"
      size="md"
      hideFooter
    >
      {isLoading || !supplier ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          {/* Identitas */}
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Nama Supplier" value={supplier.name} />
            <DetailField label="Kode Supplier">
              <code className="text-xs text-gray-700">{supplier.supplier_code || '—'}</code>
            </DetailField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Status">
              <StatusBadge status={supplier.is_active ? 'active' : 'inactive'} />
            </DetailField>
            <DetailField label="Nama Kontak" value={supplier.contact_person || '—'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Telepon" value={supplier.phone || '—'} />
            <DetailField label="Email" value={supplier.email || '—'} />
          </div>

          {supplier.address && (
            <DetailField label="Alamat" value={supplier.address} />
          )}

          {supplier.notes && (
            <DetailField label="Catatan" value={supplier.notes} />
          )}

          {/* Riwayat Pembelian */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Riwayat Pembelian
            </p>
            {supplier.purchase_history.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Belum ada riwayat pembelian.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Kode', 'Tanggal', 'Total', 'Status', 'Sisa'].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.purchase_history.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-2 py-1.5 font-mono">{p.purchase_code}</td>
                        <td className="px-2 py-1.5 text-gray-600">{formatDate(p.purchase_date)}</td>
                        <td className="px-2 py-1.5">{formatRupiah(p.total_amount)}</td>
                        <td className="px-2 py-1.5">
                          {(() => {
                            const status = p.payment_status || 'unpaid'
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                                  PAYMENT_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {PAYMENT_STATUS_LABEL[status] ?? status}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-2 py-1.5">
                          {p.remaining_amount > 0
                            ? formatRupiah(p.remaining_amount)
                            : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
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

function DetailField({
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
