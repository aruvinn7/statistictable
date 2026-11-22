import type { GridModel } from './tables/types'

export function formatValue(v: number, digits = 3, scientific = false): string {
  if (v === Infinity) return '∞'
  if (v === -Infinity) return '−∞'
  if (scientific && v !== 0 && (Math.abs(v) < 10 ** -digits || Math.abs(v) >= 1e6)) {
    return v.toExponential(Math.min(6, digits))
  }
  const limit = 10 ** -digits
  if (v !== 0 && Math.abs(v) < limit) return `<${limit.toFixed(digits)}`
  return v.toFixed(digits)
}

export const formatNumber = (v: number, digits = 3, scientific = false) => formatValue(v, digits, scientific)

export function formatProbability(v: number, digits = 4, scientific = false): string {
  return formatValue(v, digits, scientific)
}

const escape = (v: string) => /[,"\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v
export function toCsv(model: GridModel) {
  return [[model.rowHeader, ...model.columns.map(c => c.label)], ...model.rows.map(r => [r.label, ...r.cells.map(v => v === null ? '' : String(v))])].map(r => r.map(escape).join(',')).join('\n')
}
