import { regularizedBeta } from './special'

export function tCdf(t: number, df: number): number {
  if (df <= 0) throw new RangeError('df harus > 0')
  const x = df / (df + t * t)
  const tail = regularizedBeta(df / 2, 0.5, x) / 2
  return t > 0 ? 1 - tail : tail
}

export function tQuantile(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p harus di antara 0 dan 1')
  if (df <= 0) throw new RangeError('df harus > 0')
  let lo = -1e6
  let hi = 1e6
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2
    if (tCdf(mid, df) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function tCritical(alpha: number, df: number, tails: 1 | 2): number {
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  return tQuantile(1 - alpha / tails, df)
}
