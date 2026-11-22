import { inverseRegularizedGammaP, regularizedGammaP } from './special'

export function chiSquareCdf(x: number, df: number): number {
  if (df <= 0) throw new RangeError('df harus > 0')
  if (x <= 0) return 0
  return regularizedGammaP(df / 2, x / 2)
}

export function chiSquareQuantile(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p harus di antara 0 dan 1')
  if (df <= 0) throw new RangeError('df harus > 0')
  return 2 * inverseRegularizedGammaP(p, df / 2)
}

export function chiSquareCritical(alpha: number, df: number): number {
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  return chiSquareQuantile(1 - alpha, df)
}
