import type { PriceTier, ProductPackage } from './products.types'

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

export function formatProductPackage(pkg: ProductPackage): string {
  return pkg.package_name ? `${pkg.unit_name} (${pkg.package_name})` : pkg.unit_name
}
