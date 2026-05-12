export function formatRupiah(value: number, withDecimal = false): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: withDecimal ? 2 : 0,
    maximumFractionDigits: withDecimal ? 2 : 0,
  }).format(value)
  // Intl returns "Rp 150.000" already in id-ID locale
  return formatted
}

export function parseRupiah(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}
