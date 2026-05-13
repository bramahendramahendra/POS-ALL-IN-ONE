import { useState } from 'react'
import { Printer } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatRupiah } from '@/shared/utils'

import type { Product } from '../products.types'

interface LabelPrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
}

type LabelSize = 'small' | 'medium' | 'large'
type ColCount = '2' | '3' | '4'

const SIZE_CONFIG: Record<LabelSize, { width: string; fontSize: string; label: string }> = {
  small: { width: '6cm', fontSize: '9px', label: 'Kecil (6cm)' },
  medium: { width: '8cm', fontSize: '11px', label: 'Sedang (8cm)' },
  large: { width: '10cm', fontSize: '13px', label: 'Besar (10cm)' },
}

function getDefaultPrice(product: Product): number | null {
  const defaultUnit = product.units.find((u) => u.is_default)
  if (!defaultUnit) return null
  const price = product.prices.find((p) => p.unit_id === defaultUnit.unit_id && p.min_qty <= 1)
  return price?.price ?? null
}

export function LabelPrintModal({ open, onOpenChange, products }: LabelPrintModalProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('medium')
  const [cols, setCols] = useState<ColCount>('3')

  if (!open) return null

  const { width, fontSize } = SIZE_CONFIG[labelSize]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="no-print flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">Cetak Label Produk</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Settings */}
        <div className="no-print flex items-center gap-4 border-b px-5 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Ukuran Label:</Label>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
              <SelectTrigger className="h-8 w-[140px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SIZE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Kolom:</Label>
            <Select value={cols} onValueChange={(v) => setCols(v as ColCount)}>
              <SelectTrigger className="h-8 w-[80px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => window.print()} className="ml-auto gap-1">
            <Printer size={14} />
            Cetak
          </Button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <style>{`
            @media print {
              .no-print { display: none !important; }
              body > *:not(.print-root) { display: none !important; }
              .label-grid {
                display: grid !important;
                grid-template-columns: repeat(${cols}, 1fr) !important;
                gap: 4px !important;
              }
              .label-item { page-break-inside: avoid; }
            }
          `}</style>

          <div
            className="label-grid print-root"
            style={
              {
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '8px',
                '--cols': cols,
              } as React.CSSProperties
            }
          >
            {products.map((product) => {
              const price = getDefaultPrice(product)
              const defaultUnit = product.units.find((u) => u.is_default)
              const barcode = defaultUnit?.barcode

              return (
                <div
                  key={product.id}
                  className="label-item border rounded p-2 flex flex-col gap-0.5"
                  style={{ width, fontSize, boxSizing: 'border-box' }}
                >
                  <p className="font-bold leading-tight line-clamp-2">{product.name}</p>
                  {product.sku && <p className="font-mono text-gray-500">{product.sku}</p>}
                  {price !== null && (
                    <p className="font-semibold text-gray-800">{formatRupiah(price)}</p>
                  )}
                  {barcode && <p className="font-mono text-gray-400 text-[0.7em]">{barcode}</p>}
                </div>
              )
            })}
          </div>

          {products.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Tidak ada produk dipilih</p>
          )}
        </div>
      </div>
    </div>
  )
}
