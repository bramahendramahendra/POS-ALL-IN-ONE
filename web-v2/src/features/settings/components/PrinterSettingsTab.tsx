import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import { usePrinterSettingsQuery, useUpdatePrinterSettingsMutation } from '../settings.api'
import type { PrinterSettings } from '../settings.api'

const DEFAULT_SETTINGS: PrinterSettings = {
  paper_size: '80mm',
  receipt_header: '',
  receipt_footer: 'Terima kasih telah berbelanja!',
  show_logo: true,
  auto_print: false,
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-[#2c3e50]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function openTestPrint(settings: PrinterSettings) {
  const width = settings.paper_size === '58mm' ? '220px' : '302px'
  const now = new Date().toLocaleString('id-ID')
  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return
  win.document.write(`
    <html><head>
      <style>
        body { font-family: monospace; font-size: 12px; width: ${width}; margin: 0 auto; padding: 8px; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
      </style>
    </head><body>
      ${settings.show_logo ? '<div class="center"><strong>[LOGO]</strong></div>' : ''}
      <div class="center"><strong>${settings.receipt_header || 'Nama Toko'}</strong></div>
      <div class="center">Struk Pembelian</div>
      <div class="divider"></div>
      <div class="row"><span>Tanggal:</span><span>${now}</span></div>
      <div class="row"><span>Kasir:</span><span>Test Kasir</span></div>
      <div class="divider"></div>
      <div class="row"><span>Produk A × 2</span><span>Rp 20.000</span></div>
      <div class="row"><span>Produk B × 1</span><span>Rp 15.000</span></div>
      <div class="divider"></div>
      <div class="row"><strong><span>TOTAL</span><span>Rp 35.000</span></strong></div>
      <div class="row"><span>Tunai</span><span>Rp 50.000</span></div>
      <div class="row"><span>Kembali</span><span>Rp 15.000</span></div>
      <div class="divider"></div>
      <div class="center">${settings.receipt_footer}</div>
    </body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
  win.close()
}

export function PrinterSettingsTab() {
  const { data, isLoading } = usePrinterSettingsQuery()
  const { mutate: save, isPending } = useUpdatePrinterSettingsMutation()
  const [form, setForm] = useState<PrinterSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save(form)
  }

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {/* Paper & Header */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Konfigurasi Struk</h3>

        <div className="space-y-1.5">
          <Label>Ukuran Kertas</Label>
          <Select
            value={form.paper_size}
            onValueChange={(v) => setForm((f) => ({ ...f, paper_size: v as '58mm' | '80mm' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="58mm">58mm</SelectItem>
              <SelectItem value="80mm">80mm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-header">Header Struk</Label>
          <Input
            id="pr-header"
            value={form.receipt_header}
            onChange={(e) => setForm((f) => ({ ...f, receipt_header: e.target.value }))}
            placeholder="Nama toko atau teks header"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-footer">Footer Struk</Label>
          <Textarea
            id="pr-footer"
            value={form.receipt_footer}
            onChange={(e) => setForm((f) => ({ ...f, receipt_footer: e.target.value }))}
            placeholder="Teks bawah struk..."
            className="resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-lg border bg-white px-5 py-2">
        <h3 className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-100">
          Preferensi
        </h3>
        <ToggleRow
          label="Tampilkan Logo"
          description="Tampilkan logo toko di bagian atas struk"
          checked={form.show_logo}
          onChange={(v) => setForm((f) => ({ ...f, show_logo: v }))}
        />
        <ToggleRow
          label="Auto Print"
          description="Langsung cetak struk setelah transaksi selesai"
          checked={form.auto_print}
          onChange={(v) => setForm((f) => ({ ...f, auto_print: v }))}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => openTestPrint(form)}
        >
          <Printer size={15} />
          Test Print
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
