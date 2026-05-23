import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import { useOpenCashDrawerMutation } from '../cash-drawer.api'
import type { OpenCashDrawerPayload, ShiftType } from '../cash-drawer.types'

interface OpenCashDrawerModalProps {
  open: boolean
  onClose: () => void
}

const SHIFT_OPTIONS: { value: ShiftType; label: string }[] = [
  { value: 'pagi', label: 'Pagi' },
  { value: 'siang', label: 'Siang' },
  { value: 'malam', label: 'Malam' },
]

function getEmptyForm(): OpenCashDrawerPayload {
  return { opening_balance: 0, shift: undefined, notes: '' }
}

export function OpenCashDrawerModal({ open, onClose }: OpenCashDrawerModalProps) {
  const [form, setForm] = useState<OpenCashDrawerPayload>(getEmptyForm)
  const mutation = useOpenCashDrawerMutation()

  function handleSubmit() {
    const payload: OpenCashDrawerPayload = {
      opening_balance: form.opening_balance,
      shift: form.shift,
      notes: form.notes || undefined,
    }
    mutation.mutate(payload, {
      onSuccess: () => {
        setForm(getEmptyForm())
        onClose()
      },
    })
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      setForm(getEmptyForm())
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Buka Kas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Saldo Awal (Rp)</label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={form.opening_balance === 0 ? '' : form.opening_balance}
              onChange={(e) =>
                setForm((f) => ({ ...f, opening_balance: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Shift (opsional)</label>
            <Select
              value={form.shift ?? ''}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, shift: v === '' ? undefined : (v as ShiftType) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih shift..." />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Catatan (opsional)</label>
            <Input
              placeholder="Catatan pembukaan kas..."
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || form.opening_balance < 0}
          >
            {mutation.isPending ? 'Memproses...' : 'Buka Kas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
