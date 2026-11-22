import { normalQuantile } from './normal'

export function runsCritical(
  n1: number,
  n2: number,
  alpha: number,
): { lower: number; upper: number } {
  if (!Number.isInteger(n1) || !Number.isInteger(n2) || n1 < 1 || n2 < 1) {
    throw new RangeError('n1 dan n2 harus bilangan bulat >= 1')
  }
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  const n = n1 + n2
  const mean = (2 * n1 * n2) / n + 1
  const variance = (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) / (n * n * (n - 1))
  const z = normalQuantile(1 - alpha / 2)
  const sd = Math.sqrt(variance)
  return {
    lower: Math.max(2, Math.ceil(mean - z * sd)),
    upper: Math.floor(mean + z * sd),
  }
}
