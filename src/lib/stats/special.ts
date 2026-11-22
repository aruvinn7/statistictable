const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]

const FPMIN = 1e-300
const EPS = 3e-14

export function logGamma(x: number): number {
  if (x <= 0) throw new RangeError('logGamma hanya untuk x > 0')
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const z = x - 1
  let sum = LANCZOS[0]
  const t = z + 7.5
  for (let i = 1; i < 9; i++) sum += LANCZOS[i] / (z + i)
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum)
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

export function regularizedBeta(a: number, b: number, x: number): number {
  if (a <= 0 || b <= 0) throw new RangeError('parameter beta harus > 0')
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x),
  )
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b
}

export function inverseRegularizedBeta(p: number, a: number, b: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p harus di antara 0 dan 1')
  let lo = 0
  let hi = 1
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (regularizedBeta(a, b, mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function regularizedGammaP(a: number, x: number): number {
  if (a <= 0) throw new RangeError('parameter gamma harus > 0')
  if (x < 0) throw new RangeError('x tidak boleh negatif')
  if (x === 0) return 0

  if (x < a + 1) {
    let ap = a
    let del = 1 / a
    let sum = del
    for (let n = 1; n <= 500; n++) {
      ap += 1
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * 1e-15) break
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
  }

  let b = x + 1 - a
  let c = 1 / FPMIN
  let d = 1 / b
  let h = d
  for (let i = 1; i <= 500; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = b + an / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-15) break
  }
  const q = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
  return 1 - q
}

export function inverseRegularizedGammaP(p: number, a: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p harus di antara 0 dan 1')
  if (a <= 0) throw new RangeError('parameter gamma harus > 0')
  let hi = Math.max(1, a)
  while (regularizedGammaP(a, hi) < p) {
    hi *= 2
    if (hi > 1e12) break
  }
  let lo = 0
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2
    if (regularizedGammaP(a, mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function erf(x: number): number {
  if (x === 0) return 0
  const value = regularizedGammaP(0.5, x * x)
  return x > 0 ? value : -value
}
