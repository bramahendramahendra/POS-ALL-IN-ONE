import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { useAuthStore } from '@/features/auth'
import { ROLES } from '@/shared/constants/roles'
import { usePagination } from '@/shared/hooks'

import { useCashDrawerCurrentQuery, useCashDrawerListQuery, useCloseCashDrawerMutation } from './cash-drawer.api'
import type { CashDrawerFilter, CashDrawer } from './cash-drawer.types'
import { CashDrawerTable } from './components/CashDrawerTable'
import { CashDrawerDetailModal } from './components/CashDrawerDetailModal'
import { OpenCashDrawerModal } from './components/OpenCashDrawerModal'

const SHIFT_LABELS: Record<string, string> = {
  pagi: 'Pagi',
  siang: 'Siang',
  malam: 'Malam',
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function monthStartString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function CashDrawerPage() {
  const today = todayString()
  const { user } = useAuthStore()
  const isAdminOrOwner = user?.roleName === ROLES.OWNER || user?.roleName === ROLES.ADMIN

  const [dateFrom, setDateFrom] = useState(monthStartString())
  const [dateTo, setDateTo] = useState(today)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closingBalance, setClosingBalance] = useState<number>(0)
  const [closeNotes, setCloseNotes] = useState('')

  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()

  const filter: CashDrawerFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useCashDrawerListQuery(filter)
  const { data: currentData } = useCashDrawerCurrentQuery()
  const closeMutation = useCloseCashDrawerMutation()

  const items: CashDrawer[] = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  const currentDrawer = currentData?.data ?? null
  const isOpen = currentDrawer?.status === 'open'

  function handleClose() {
    if (!currentDrawer) return
    closeMutation.mutate(
      { id: currentDrawer.id, closing_balance: closingBalance, notes: closeNotes || undefined },
      {
        onSuccess: () => {
          setCloseModalOpen(false)
          setClosingBalance(0)
          setCloseNotes('')
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kas Harian"
        breadcrumbs={[{ label: 'Keuangan' }, { label: 'Kas Harian' }]}
      />

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Status Kas Hari Ini</p>
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <Badge variant="default" className="bg-green-600">● Buka</Badge>
                ) : (
                  <Badge variant="secondary">● Tutup</Badge>
                )}
                {isOpen && currentDrawer?.shift && (
                  <span className="text-sm text-gray-500">
                    Shift: {SHIFT_LABELS[currentDrawer.shift] ?? currentDrawer.shift}
                  </span>
                )}
              </div>
            </div>
            <div>
              {isOpen && isAdminOrOwner ? (
                <Button onClick={() => setCloseModalOpen(true)}>Tutup Kas</Button>
              ) : !isOpen ? (
                <Button onClick={() => setOpenModalOpen(true)}>Buka Kas</Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setDateFrom(monthStartString()); setDateTo(today); reset() }}
        >
          Bulan ini
        </Button>
      </div>

      <CashDrawerTable
        data={items}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <CashDrawerDetailModal cashDrawerId={selectedId} onClose={() => setSelectedId(null)} />
      <OpenCashDrawerModal open={openModalOpen} onClose={() => setOpenModalOpen(false)} />

      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tutup Kas Hari Ini</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Saldo Penutupan (Rp)</label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={closingBalance === 0 ? '' : closingBalance}
                onChange={(e) => setClosingBalance(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Catatan (opsional)</label>
              <Input
                placeholder="Masukkan catatan penutupan kas..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleClose} disabled={closeMutation.isPending || closingBalance < 0}>
              {closeMutation.isPending ? 'Memproses...' : 'Tutup Kas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
