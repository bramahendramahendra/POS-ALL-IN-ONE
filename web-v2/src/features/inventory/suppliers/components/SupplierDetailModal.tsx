import { useState } from 'react'

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

const RETURN_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const RETURN_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

type TabKey = 'pembelian' | 'retur'

export function SupplierDetailModal({ open, onOpenChange, supplierId }: SupplierDetailModalProps) {
  const enabled = open && (supplierId ?? 0) > 0
  const { data: supplier, isLoading } = useSupplierDetailQuery(enabled ? (supplierId as number) : 0)
  const [activeTab, setActiveTab] = useState<TabKey>('pembelian')

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

          {/* Summary Cards */}
          <div className="border-t pt-3 grid grid-cols-3 gap-2">
            <SummaryCard
              label="Total Pembelian"
              value={formatRupiah(supplier.total_amount)}
              sub={`${supplier.total_purchases} transaksi`}
              color="blue"
            />
            <SummaryCard
              label="Total Hutang"
              value={formatRupiah(supplier.total_debt)}
              sub={supplier.total_debt > 0 ? 'Belum lunas' : 'Semua lunas'}
              color={supplier.total_debt > 0 ? 'red' : 'green'}
            />
            <SummaryCard
              label="Total Retur"
              value={formatRupiah(supplier.total_return)}
              sub={`${supplier.return_history.length} retur`}
              color="orange"
            />
          </div>

          {/* Tabs */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex gap-1 border-b">
              {(['pembelian', 'retur'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'pembelian' ? `Riwayat Pembelian (${supplier.purchase_history.length})` : `Riwayat Retur (${supplier.return_history.length})`}
                </button>
              ))}
            </div>

            {/* Tab Pembelian */}
            {activeTab === 'pembelian' && (
              supplier.purchase_history.length === 0 ? (
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
              )
            )}

            {/* Tab Retur */}
            {activeTab === 'retur' && (
              supplier.return_history.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Belum ada riwayat retur.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Kode', 'Tanggal', 'Total Retur', 'Alasan', 'Status'].map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.return_history.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-2 py-1.5 font-mono">{r.return_code}</td>
                          <td className="px-2 py-1.5 text-gray-600">{formatDate(r.return_date)}</td>
                          <td className="px-2 py-1.5">{formatRupiah(r.total_return)}</td>
                          <td className="px-2 py-1.5 max-w-[120px] truncate text-gray-600" title={r.reason}>
                            {r.reason || '—'}
                          </td>
                          <td className="px-2 py-1.5">
                            {(() => {
                              const status = r.status || 'pending'
                              return (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                                    RETURN_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {RETURN_STATUS_LABEL[status] ?? status}
                                </span>
                              )
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
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

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: 'blue' | 'red' | 'green' | 'orange'
}) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
  }
  const subColorMap = {
    blue: 'text-blue-500',
    red: 'text-red-400',
    green: 'text-green-500',
    orange: 'text-orange-400',
  }

  return (
    <div className={`rounded-lg border p-2.5 ${colorMap[color]}`}>
      <p className="text-xs opacity-70 mb-0.5">{label}</p>
      <p className="font-semibold text-sm leading-tight">{value}</p>
      <p className={`text-xs mt-0.5 ${subColorMap[color]}`}>{sub}</p>
    </div>
  )
}
