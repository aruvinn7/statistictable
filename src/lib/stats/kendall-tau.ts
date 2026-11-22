import { normalQuantile } from './normal'

export function kendallTauCriticalS(n: number, alpha: number, tails: 1 | 2): number {
  if (!Number.isInteger(n) || n < 4) throw new RangeError('n harus bilangan bulat >= 4')
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  const sd = Math.sqrt((n * (n - 1) * (2 * n + 5)) / 18)
  const z = normalQuantile(1 - alpha / tails)
  return Math.max(0, Math.ceil(z * sd - 0.5))
}
