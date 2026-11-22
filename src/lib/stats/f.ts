import { regularizedBeta } from './special'

export function fCdf(x: number, df1: number, df2: number): number {
  if (df1 <= 0 || df2 <= 0) throw new RangeError('df harus > 0')
  if (x <= 0) return 0
  return regularizedBeta(df1 / 2, df2 / 2, (df1 * x) / (df1 * x + df2))
}

export function fCritical(alpha: number, df1: number, df2: number): number {
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  if (df1 <= 0 || df2 <= 0) throw new RangeError('df harus > 0')
  let lo = 0
  let hi = 1
  while (fCdf(hi, df1, df2) < 1 - alpha) {
    hi *= 2
    if (hi > 1e12) break
  }
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2
    if (fCdf(mid, df1, df2) < 1 - alpha) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
