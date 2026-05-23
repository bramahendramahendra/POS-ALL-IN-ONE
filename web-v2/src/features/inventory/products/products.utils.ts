import type { PriceTier, ProductUnit } from './products.types'

export function validateImportRow(row: unknown): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (!row || typeof row !== 'object') {
    return { valid: false, errors: ['Baris tidak valid'], warnings: [] }
  }

  const r = row as Record<string, unknown>

  const nama = String(r['nama'] ?? '').trim()
  const barcode = String(r['barcode'] ?? '').trim()
  const hargaBeli = Number(r['harga_beli'] ?? 0)
  const hargaJual = Number(r['harga_jual'] ?? 0)
  const satuan = String(r['satuan'] ?? '').trim()
  const kategori = String(r['kategori'] ?? '').trim()

  if (!nama) errors.push('Nama produk wajib diisi')
  if (!barcode) errors.push('Barcode wajib diisi')
  if (hargaJual <= 0) errors.push('Harga jual harus lebih dari 0')
  if (hargaJual < hargaBeli) errors.push('Harga jual tidak boleh lebih rendah dari harga beli')
  if (!satuan) errors.push('Satuan wajib diisi')
  if (!kategori) warnings.push('Kategori kosong — produk akan masuk tanpa kategori')

  return { valid: errors.length === 0, errors, warnings }
}

export function getApplicablePrice(
  prices: PriceTier[],
  unitId: number,
  qty: number
): number | null {
  const tiersByUnit = prices
    .filter((p) => p.unit_id === unitId && p.min_qty <= qty)
    .sort((a, b) => b.min_qty - a.min_qty)

  return tiersByUnit[0]?.price ?? null
}

export function formatProductUnit(unit: ProductUnit): string {
  const barcode = unit.barcode ? ` — ${unit.barcode}` : ''
  return `${unit.unit_name}${barcode}`
}
