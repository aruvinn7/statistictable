import { binomialCritical } from './binomial'

export function signTestCritical(n: number, alpha: number, tails: 1 | 2): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n harus bilangan bulat >= 1')
  return binomialCritical(n, alpha, tails)
}
