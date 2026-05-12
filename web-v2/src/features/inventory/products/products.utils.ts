import type { PriceTier, ProductUnit } from './products.types'

export function validateImportRow(row: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!row || typeof row !== 'object') {
    return { valid: false, errors: ['Baris tidak valid'] }
  }

  const r = row as Record<string, unknown>

  if (!r['name'] || typeof r['name'] !== 'string' || r['name'].trim() === '') {
    errors.push('Nama produk wajib diisi')
  }
  if (r['is_active'] !== undefined && typeof r['is_active'] !== 'boolean') {
    errors.push('Field is_active harus bernilai boolean')
  }

  return { valid: errors.length === 0, errors }
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
