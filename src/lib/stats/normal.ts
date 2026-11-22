import { erf } from './special'

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

export function normalQuantile(p: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p harus di antara 0 dan 1')
  let lo = -40
  let hi = 40
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (normalCdf(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
