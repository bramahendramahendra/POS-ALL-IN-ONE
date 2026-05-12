export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return roundTo((value / total) * 100, 2)
}
