import { chiSquareCritical } from './chi'

function validate(k: number, n: number): void {
  if (!Number.isInteger(k) || k < 2) throw new RangeError('k harus bilangan bulat >= 2')
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n harus bilangan bulat >= 1')
}

// n diterima untuk keseragaman antarmuka; aproksimasi chi-square tidak memakainya.
export function kruskalWallisCritical(k: number, n: number, alpha: number): number {
  validate(k, n)
  return chiSquareCritical(alpha, k - 1)
}

export function friedmanCritical(k: number, n: number, alpha: number): number {
  validate(k, n)
  return chiSquareCritical(alpha, k - 1)
}

export function kendallWCritical(k: number, n: number, alpha: number): number {
  validate(k, n)
  return chiSquareCritical(alpha, k - 1)
}

export function cochranQCritical(k: number, n: number, alpha: number): number {
  validate(k, n)
  return chiSquareCritical(alpha, k - 1)
}
