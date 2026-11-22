import { logGamma } from './special'

export function poissonPmf(lambda: number, k: number): number {
  if (!(lambda > 0)) throw new RangeError('lambda harus > 0')
  if (!Number.isInteger(k) || k < 0) return 0
  return Math.exp(-lambda + k * Math.log(lambda) - logGamma(k + 1))
}

export function poissonCdf(lambda: number, k: number): number {
  if (!(lambda > 0)) throw new RangeError('lambda harus > 0')
  if (k < 0) return 0
  let sum = 0
  for (let i = 0; i <= k; i++) sum += poissonPmf(lambda, i)
  return Math.min(1, sum)
}
