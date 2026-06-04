import { useState } from 'react'
import { toast } from 'sonner'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, FormModal, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { formatRupiah } from '@/shared/utils'

import { useSupplierReturnDetailQuery, useUpdateSupplierReturnStatusMutation } from '../supplier-returns.api'
import type { SupplierReturn } from '../supplier-returns.types'

interface ReturnDetailModalProps {
  returnId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_CLASS: Record<SupplierReturn['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_LABEL: Record<SupplierReturn['status'], string> = {
  pending: 'Pending',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function ReturnDetailModal({ returnId, open, onOpenChange }: ReturnDetailModalProps) {
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)

  const { data: detail, isLoading } = useSupplierReturnDetailQuery(open ? returnId : null)
  const { mutate: updateStatus, isPending } = useUpdateSupplierReturnStatusMutation()

  function handleApproveConfirm() {
    if (!returnId) return
    updateStatus(
      { id: returnId, payload: { status: 'approved' } },
      {
        onSuccess: () => {
          toast.success('Retur berhasil disetujui')
          setApproveOpen(false)
          onOpenChange(false)
        },
      },
    )
  }

  function handleReject() {
    if (!returnId) return
    if (!rejectNotes.trim()) {
      toast.error('Catatan penolakan wajib diisi')
      return
    }
    updateStatus(
      { id: returnId, payload: { status: 'rejected', notes: rejectNotes } },
      {
        onSuccess: () => {
          toast.success('Retur ditolak')
          setRejectNotes('')
          setShowRejectInput(false)
          onOpenChange(false)
        },
      },
    )
  }

  function handleClose(o: boolean) {
    if (!o) {
      setRejectNotes('')
      setShowRejectInput(false)
    }
    onOpenChange(o)
  }

  return (
    <>
      <FormModal
        open={open}
        onOpenChange={handleClose}
        title="Detail Retur Pembelian"
        size="lg"
        hideFooter
      >
        {isLoading || !detail ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-gray-50 p-4">
              <DetailField label="Kode Retur">
                <span className="font-mono font-medium text-blue-700">{detail.return_code}</span>
              </DetailField>
              <DetailField label="Tanggal" value={formatDate(detail.return_date)} />
              <DetailField label="Supplier" value={detail.supplier_name} />
              <DetailField label="Status">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[detail.status]}`}
                >
                  {STATUS_LABEL[detail.status]}
                </span>
              </DetailField>
              <DetailField label="Alasan" value={detail.reason} />
              <DetailField label="Dibuat oleh" value={detail.user_name} />
              {detail.notes && (
                <div className="col-span-2">
                  <DetailField label="Catatan" value={detail.notes} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-medium">Item yang Diretur</p>
              <div className="rounded-lg border divide-y">
                <div className="flex gap-3 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                  <span className="flex-1">Produk</span>
                  <span className="w-16 text-right">Qty</span>
                  <span className="w-12 text-right">Satuan</span>
                  <span className="w-28 text-right">Harga Beli</span>
                  <span className="w-28 text-right">Subtotal</span>
                </div>
                {(detail.items ?? []).map((item) => (
                  <div key={item.id} className="flex gap-3 px-3 py-2">
                    <span className="flex-1">{item.product_name}</span>
                    <span className="w-16 text-right">{item.quantity}</span>
                    <span className="w-12 text-right text-gray-500">{item.unit}</span>
                    <span className="w-28 text-right">{formatRupiah(item.purchase_price)}</span>
                    <span className="w-28 text-right font-medium">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
                <div className="flex justify-end gap-3 px-3 py-2 bg-gray-50">
                  <span className="font-semibold">Total</span>
                  <span className="w-28 text-right font-bold text-red-600">
                    {formatRupiah(detail.total_return_amount)}
                  </span>
                </div>
              </div>
            </div>

            {detail.status === 'pending' && showRejectInput && (
              <div className="space-y-1.5">
                <Label htmlFor="reject-notes">
                  Catatan Penolakan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reject-notes"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Masukkan alasan penolakan..."
                  className="resize-none"
                  rows={2}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Tutup
              </Button>

              {detail.status === 'pending' && (
                <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
                  {!showRejectInput ? (
                    <>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => setShowRejectInput(true)}
                        disabled={isPending}
                      >
                        Tolak
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setApproveOpen(true)}
                        disabled={isPending}
                      >
                        Setujui
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => { setShowRejectInput(false); setRejectNotes('') }}
                        disabled={isPending}
                      >
                        Batal
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isPending}
                      >
                        {isPending ? 'Memproses...' : 'Konfirmasi Tolak'}
                      </Button>
                    </>
                  )}
                </RoleGuard>
              )}
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Setujui Retur"
        description="Stok produk akan dikurangi dan hutang supplier akan disesuaikan. Yakin ingin menyetujui retur ini?"
        confirmLabel="Ya, Setujui"
        isLoading={isPending}
        onConfirm={handleApproveConfirm}
      />
    </>
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
