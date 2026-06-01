import { FormModal, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'

import { useProductDetailQuery, useProductPackagesQuery } from '../products.api'

interface ProductDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: number
}

function calcMargin(purchasePrice: number, sellingPrice: number): number {
  if (purchasePrice <= 0 || sellingPrice <= 0) return 0
  return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100)
}

export function ProductDetailModal({ open, onOpenChange, productId }: ProductDetailModalProps) {
  const enabled = open && (productId ?? 0) > 0
  const { data: product, isLoading } = useProductDetailQuery(enabled ? (productId as number) : 0)
  const { data: units = [] } = useProductPackagesQuery(enabled ? (productId as number) : 0)

  const margin = product ? calcMargin(product.purchase_price, product.selling_price) : 0
  const grosirUnits = units.filter((u) => !u.is_default)

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Detail Produk"
      size="md"
      hideFooter
    >
      {isLoading || !product ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          {/* Identitas */}
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Nama Produk" value={product.name} />
            <DetailField label="Status">
              <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
            </DetailField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Barcode">
              <code className="text-xs text-gray-700">{product.barcode || '—'}</code>
            </DetailField>
            <DetailField label="SKU / Kode">
              <code className="text-xs text-gray-700">{product.sku || '—'}</code>
            </DetailField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Kategori" value={product.category_name || '—'} />
            <DetailField label="Satuan" value={product.unit_name || '—'} />
          </div>

          {product.description && (
            <DetailField label="Deskripsi" value={product.description} />
          )}

          {/* Harga */}
          <div className="rounded-md border bg-gray-50 p-3 grid grid-cols-3 gap-3">
            <DetailField label="Harga Beli" value={formatRupiah(product.purchase_price)} />
            <DetailField label="Harga Jual" value={formatRupiah(product.selling_price)} />
            <DetailField label="Margin">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  margin >= 30
                    ? 'bg-green-100 text-green-700'
                    : margin >= 15
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                }`}
              >
                {margin}%
              </span>
            </DetailField>
          </div>

          {/* Stok */}
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Stok">
              <span
                className={`font-medium ${
                  product.stock === 0
                    ? 'text-red-600'
                    : product.stock < product.min_stock
                      ? 'text-amber-600'
                      : 'text-gray-800'
                }`}
              >
                {product.stock}
              </span>
            </DetailField>
            <DetailField label="Stok Minimum" value={String(product.min_stock)} />
          </div>

          {/* Grosiran */}
          {grosirUnits.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Grosiran / Satuan Lain</p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Nama Paket', 'Isi', 'H. Beli', 'H. Jual'].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grosirUnits.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="px-2 py-1.5 font-medium">{u.unit_name}</td>
                        <td className="px-2 py-1.5 text-gray-600">{u.conversion_qty} {product.unit_name}</td>
                        <td className="px-2 py-1.5">{formatRupiah(u.purchase_price)}</td>
                        <td className="px-2 py-1.5">{formatRupiah(u.selling_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
