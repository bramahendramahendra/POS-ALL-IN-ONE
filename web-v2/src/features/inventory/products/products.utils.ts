import type { PriceTier, ProductUnit } from './products.types'

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
