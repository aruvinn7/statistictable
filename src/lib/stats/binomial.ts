import { logGamma } from './special'

export function binomialPmf(n: number, p: number, k: number): number {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n harus bilangan bulat >= 0')
  if (!(p >= 0 && p <= 1)) throw new RangeError('p harus antara 0 dan 1')
  if (!Number.isInteger(k) || k < 0 || k > n) return 0
  if (p === 0) return k === 0 ? 1 : 0
  if (p === 1) return k === n ? 1 : 0
  const logChoose = logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
  return Math.exp(logChoose + k * Math.log(p) + (n - k) * Math.log1p(-p))
}

export function binomialCdf(n: number, p: number, k: number): number {
  if (k < 0) return 0
  if (k >= n) return 1
  let sum = 0
  for (let i = 0; i <= k; i++) sum += binomialPmf(n, p, i)
  return Math.min(1, sum)
}

export function binomialCritical(n: number, alpha: number, tails: 1 | 2): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n harus bilangan bulat >= 1')
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  const target = alpha / tails
  let result = 0
  for (let k = 0; k <= n; k++) {
    if (binomialCdf(n, 0.5, k) <= target) result = k
    else break
  }
  return result
}
