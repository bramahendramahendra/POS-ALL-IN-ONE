import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { useAuthStore } from '@/features/auth'
import { ROLES } from '@/shared/constants/roles'

import { useCashDrawerCurrentQuery, useCashDrawerListQuery, useCloseCashDrawerMutation } from './cash-drawer.api'
import type { CashDrawerFilter, CashDrawer } from './cash-drawer.types'
import { CashDrawerTable } from './components/CashDrawerTable'
import { CashDrawerDetailModal } from './components/CashDrawerDetailModal'

const PAGE_SIZE = 10

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
  const canClose = user?.role === ROLES.OWNER || user?.role === ROLES.ADMIN

  const [dateFrom, setDateFrom] = useState(monthStartString())
  const [dateTo, setDateTo] = useState(today)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closeNotes, setCloseNotes] = useState('')

  const filter: CashDrawerFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    page_size: PAGE_SIZE,
  }

  const { data, isLoading } = useCashDrawerListQuery(filter)
  const { data: currentData } = useCashDrawerCurrentQuery()
  const closeMutation = useCloseCashDrawerMutation()

  const items: CashDrawer[] = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  const currentDrawer = currentData?.data ?? null
  const todayIsOpen = currentDrawer?.status === 'open'

  function handleClose() {
    closeMutation.mutate(
      { notes: closeNotes },
      {
        onSuccess: () => {
          setCloseModalOpen(false)
          setCloseNotes('')
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Kas Harian"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Kas Harian' }]}
        action={
          canClose && todayIsOpen ? (
            <Button onClick={() => setCloseModalOpen(true)}>Tutup Kas</Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDateFrom(monthStartString())
            setDateTo(today)
            setPage(1)
          }}
        >
          Bulan ini
        </Button>
      </div>

      <CashDrawerTable
        data={items}
        isLoading={isLoading}
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <CashDrawerDetailModal cashDrawerId={selectedId} onClose={() => setSelectedId(null)} />

      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tutup Kas Hari Ini</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Catatan (opsional)</label>
            <Input
              placeholder="Masukkan catatan penutupan kas..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleClose} disabled={closeMutation.isPending}>
              {closeMutation.isPending ? 'Memproses...' : 'Tutup Kas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
