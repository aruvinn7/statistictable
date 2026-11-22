export function wilcoxonCounts(n: number): Float64Array {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n harus bilangan bulat >= 1')
  const max = (n * (n + 1)) / 2
  const dp = new Float64Array(max + 1)
  dp[0] = 1
  for (let i = 1; i <= n; i++) {
    for (let s = max; s >= i; s--) dp[s] += dp[s - i]
  }
  return dp
}

export function wilcoxonCritical(n: number, alpha: number, tails: 1 | 2): number {
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')
  const counts = wilcoxonCounts(n)
  let total = 0
  for (const c of counts) total += c
  const target = (alpha / tails) * total
  let cumulative = 0
  let critical = 0
  for (let t = 0; t < counts.length; t++) {
    cumulative += counts[t]
    if (cumulative <= target) critical = t
    else break
  }
  return critical
}
