import { useState } from 'react'
import Barcode from 'react-barcode'
import { Printer } from 'lucide-react'

import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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

interface SizeConfig {
  labelWidth: number
  barcodeWidth: number
  barcodeHeight: number
  nameFontSize: number
  priceFontSize: number
  skuFontSize: number
  label: string
}

const SIZE_CONFIG: Record<LabelSize, SizeConfig> = {
  small: {
    labelWidth: 160,
    barcodeWidth: 1,
    barcodeHeight: 36,
    nameFontSize: 9,
    priceFontSize: 12,
    skuFontSize: 7,
    label: 'Kecil (~4×2.5 cm)',
  },
  medium: {
    labelWidth: 220,
    barcodeWidth: 1.5,
    barcodeHeight: 48,
    nameFontSize: 11,
    priceFontSize: 15,
    skuFontSize: 8,
    label: 'Sedang (~6×3.5 cm)',
  },
  large: {
    labelWidth: 300,
    barcodeWidth: 2,
    barcodeHeight: 60,
    nameFontSize: 13,
    priceFontSize: 18,
    skuFontSize: 9,
    label: 'Besar (~8×5 cm)',
  },
}

function getDisplayPrice(product: Product): number {
  const defaultUnit = (product.units ?? []).find((u) => u.is_default)
  if (!defaultUnit) return product.selling_price
  const tiers = (product.prices ?? [])
    .filter((p) => p.unit_id === defaultUnit.unit_id)
    .sort((a, b) => a.min_qty - b.min_qty)
  return tiers[0]?.price ?? product.selling_price
}

function LabelItem({ product, cfg }: { product: Product; cfg: SizeConfig }) {
  const price = getDisplayPrice(product)
  const barcodeValue = product.barcode ?? product.sku ?? String(product.id)

  return (
    <div
      className="label-item"
      style={{
        width: cfg.labelWidth,
        boxSizing: 'border-box',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        background: '#fff',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      <p
        style={{
          fontSize: cfg.nameFontSize,
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.3,
          margin: 0,
          width: '100%',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </p>

      <p
        style={{
          fontSize: cfg.priceFontSize,
          fontWeight: 700,
          color: '#dc2626',
          margin: '2px 0',
          letterSpacing: '-0.02em',
        }}
      >
        {formatRupiah(price)}
      </p>

      <Barcode
        value={barcodeValue}
        width={cfg.barcodeWidth}
        height={cfg.barcodeHeight}
        fontSize={cfg.skuFontSize}
        margin={0}
        displayValue
      />

      {product.sku && product.sku !== barcodeValue && (
        <p style={{ fontSize: cfg.skuFontSize, color: '#6b7280', margin: 0, fontFamily: 'monospace' }}>
          {product.sku}
        </p>
      )}
    </div>
  )
}

export function LabelPrintModal({ open, onOpenChange, products }: LabelPrintModalProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('medium')
  const [cols, setCols] = useState<ColCount>('3')
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  function getQty(id: number) {
    return quantities[id] ?? 1
  }

  function setQty(id: number, val: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val || 1) }))
  }

  const cfg = SIZE_CONFIG[labelSize]

  return (
    <FormModal
      open={open}
      onOpenChange={(val) => { if (!val) setQuantities({}); onOpenChange(val) }}
      title="Cetak Label Harga"
      size="xl"
      hideFooter
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Ukuran:</Label>
          <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
            <SelectTrigger className="h-8 w-[180px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SIZE_CONFIG).map(([key, c]) => (
                <SelectItem key={key} value={key}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Kolom:</Label>
          <Select value={cols} onValueChange={(v) => setCols(v as ColCount)}>
            <SelectTrigger className="h-8 w-[70px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" className="ml-auto gap-1.5 no-print" onClick={() => window.print()}>
          <Printer size={14} />
          Cetak
        </Button>
      </div>

      {/* Qty per produk */}
      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 py-3 border-b">
          <span className="text-xs text-gray-500 whitespace-nowrap">Jumlah label:</span>
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-700 max-w-[100px] truncate">{p.name}</span>
              <Input
                type="number"
                min={1}
                max={999}
                value={getQty(p.id)}
                onChange={(e) => setQty(p.id, parseInt(e.target.value))}
                className="h-7 w-16 text-xs text-center"
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .print-root, .print-root * { visibility: visible; }
          .print-root {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            padding: 8px;
          }
          .label-grid { gap: 4px !important; }
          .label-item { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      {products.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">Tidak ada produk dipilih</p>
      ) : (
        <div
          className="label-grid print-root pt-4"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
        >
          {products.flatMap((product) =>
            Array.from({ length: getQty(product.id) }, (_, i) => (
              <LabelItem key={`${product.id}-${i}`} product={product} cfg={cfg} />
            ))
          )}
        </div>
      )}
    </FormModal>
  )
}
