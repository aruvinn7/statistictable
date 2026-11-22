export function mannWhitneyCounts(n1: number, n2: number): Float64Array {
  if (!Number.isInteger(n1) || !Number.isInteger(n2) || n1 < 1 || n2 < 1) {
    throw new RangeError('n1 dan n2 harus bilangan bulat >= 1')
  }
  const size = n1 * n2 + 1
  const dp: Float64Array[][] = []
  for (let i = 0; i <= n1; i++) {
    dp[i] = []
    for (let j = 0; j <= n2; j++) dp[i][j] = new Float64Array(i * j + 1)
  }
  dp[0][0][0] = 1

  for (let i = 0; i <= n1; i++) {
    for (let j = 0; j <= n2; j++) {
      if (i === 0 && j === 0) continue
      const current = dp[i][j]
      if (i > 0) {
        const prev = dp[i - 1][j]
        for (let u = 0; u < prev.length; u++) current[u] += prev[u]
      }
      if (j > 0) {
        const prev = dp[i][j - 1]
        for (let u = 0; u < prev.length; u++) current[u + i] += prev[u]
      }
    }
  }

  const out = new Float64Array(size)
  const full = dp[n1][n2]
  for (let u = 0; u < size; u++) out[u] = full[u] ?? 0
  return out
}

export function mannWhitneyCritical(
  n1: number,
  n2: number,
  alpha: number,
  tails: 1 | 2,
): number {
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  const counts = mannWhitneyCounts(n1, n2)
  let total = 0
  for (const c of counts) total += c
  const target = (alpha / tails) * total
  let cumulative = 0
  let critical = 0
  for (let u = 0; u < counts.length; u++) {
    cumulative += counts[u]
    if (cumulative <= target) critical = u
    else break
  }
  return critical
}
