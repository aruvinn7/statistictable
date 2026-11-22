// Distribusi Kolmogorov-Smirnov satu sampel.
// CDF eksak memakai algoritma Marsaglia-Tsang-Wang (2003) seperti
// diimplementasikan pada R (src/library/stats/src/ks.c, K2x), termasuk
// penskalaan eksponen agar matriks tidak meluap.

function multiply(a: Float64Array, b: Float64Array, m: number): Float64Array {
  const out = new Float64Array(m * m)
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < m; k++) {
      const aik = a[i * m + k]
      if (aik === 0) continue
      const row = i * m
      const brow = k * m
      for (let j = 0; j < m; j++) out[row + j] += aik * b[brow + j]
    }
  }
  return out
}

const SCALE = 1e140

/** Menormalkan matriks bila elemen tengahnya terlalu besar; mengembalikan penambah eksponen. */
function normalize(matrix: Float64Array, m: number): number {
  const center = matrix[Math.floor(m / 2) * m + Math.floor(m / 2)]
  if (center > SCALE) {
    for (let i = 0; i < matrix.length; i++) matrix[i] *= 1 / SCALE
    return 140
  }
  return 0
}

function matrixPower(base: Float64Array, exponent: number, m: number): { matrix: Float64Array; exp: number } {
  let acc: Float64Array | null = null
  let accExp = 0
  let factor: Float64Array = base.slice()
  let factorExp = 0
  let e = exponent
  while (e > 0) {
    if (e & 1) {
      if (acc === null) {
        acc = factor.slice()
        accExp = factorExp
      } else {
        acc = multiply(acc, factor, m)
        accExp += factorExp
        accExp += normalize(acc, m)
      }
    }
    e >>= 1
    if (e > 0) {
      factor = multiply(factor, factor, m)
      factorExp *= 2
      factorExp += normalize(factor, m)
    }
  }
  return { matrix: acc as Float64Array, exp: accExp }
}

export function ksOneSampleCdf(n: number, d: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n harus bilangan bulat >= 1')
  if (d <= 0) return 0
  if (d >= 1) return 1

  const k = Math.floor(n * d) + 1
  const m = 2 * k - 1
  const h = k - n * d

  const H = new Float64Array(m * m)
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) H[i * m + j] = i - j + 1 < 0 ? 0 : 1
  }
  for (let i = 0; i < m; i++) {
    H[i * m] -= Math.pow(h, i + 1)
    H[(m - 1) * m + i] -= Math.pow(h, m - i)
  }
  H[(m - 1) * m] += 2 * h - 1 > 0 ? Math.pow(2 * h - 1, m) : 0
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      const count = i - j + 1
      if (count > 0) for (let g = 1; g <= count; g++) H[i * m + j] /= g
    }
  }

  const { matrix, exp } = matrixPower(H, n, m)
  let s = matrix[(k - 1) * m + (k - 1)]
  let e = exp
  for (let i = 1; i <= n; i++) {
    s = (s * i) / n
    if (s < 1e-140) {
      s *= SCALE
      e -= 140
    }
  }
  s *= Math.pow(10, e)
  return Math.min(1, Math.max(0, s))
}

// Konstanta aproksimasi asymptotik c(alpha) ~ d * sqrt(n); dipakai hanya
// untuk mempersempit selang pencarian, bukan untuk nilai akhir.
const ASYMPTOTIC_C: Record<string, number> = {
  '0.2': 1.07,
  '0.15': 1.14,
  '0.1': 1.22,
  '0.05': 1.36,
  '0.025': 1.48,
  '0.02': 1.52,
  '0.01': 1.63,
  '0.005': 1.73,
}

const criticalCache = new Map<string, number>()

export function ksOneSampleCritical(n: number, alpha: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n harus bilangan bulat >= 1')
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')

  const key = `${n}|${alpha}`
  const cached = criticalCache.get(key)
  if (cached !== undefined) return cached

  const target = 1 - alpha
  const c = ASYMPTOTIC_C[String(alpha)] ?? 1.36
  const guess = c / Math.sqrt(n)
  let lo = Math.max(0, 0.4 * guess)
  let hi = Math.min(1, 1.5 * guess)
  if (ksOneSampleCdf(n, lo) >= target) lo = 0
  if (ksOneSampleCdf(n, hi) < target) hi = 1

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (ksOneSampleCdf(n, mid) < target) lo = mid
    else hi = mid
    if (hi - lo < 1e-9) break
  }
  const value = (lo + hi) / 2
  criticalCache.set(key, value)
  return value
}

export function ksTwoSampleCritical(n1: number, n2: number, alpha: number): number {
  if (!Number.isInteger(n1) || n1 < 1 || !Number.isInteger(n2) || n2 < 1) {
    throw new RangeError('n1 dan n2 harus bilangan bulat >= 1')
  }
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  const c = alpha <= 0.01 ? 1.63 : 1.36
  return c * Math.sqrt((n1 + n2) / (n1 * n2))
}
