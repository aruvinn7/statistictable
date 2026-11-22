// Menghasilkan nilai kritis persis Spearman rho untuk n = 4..10.
// Aturan tabel: nilai r terkecil dengan P(|R| >= r) <= alpha * (2 / tails).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ALPHAS = [0.1, 0.05, 0.025, 0.01, 0.005]
const TAILS = [1, 2]

function criticalValues(n) {
  const perm = Array.from({ length: n }, (_, i) => i)
  const total = factorial(n)
  const counts = new Map()
  const c = new Array(n).fill(0)

  const record = () => {
    let d2 = 0
    for (let i = 0; i < n; i++) {
      const diff = i - perm[i]
      d2 += diff * diff
    }
    const rho = Math.abs(1 - (6 * d2) / (n * (n * n - 1)))
    const key = rho.toFixed(9)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  record()
  let i = 0
  while (i < n) {
    if (c[i] < i) {
      if (i % 2 === 0) swap(perm, 0, i)
      else swap(perm, c[i], i)
      record()
      c[i] += 1
      i = 0
    } else {
      c[i] = 0
      i += 1
    }
  }

  const unique = [...counts.entries()]
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => a.value - b.value)

  const tail = new Array(unique.length)
  let running = 0
  for (let j = unique.length - 1; j >= 0; j--) {
    running += unique[j].count
    tail[j] = running / total
  }

  const out = {}
  for (const alpha of ALPHAS) {
    out[String(alpha)] = {}
    for (const tails of TAILS) {
      const target = alpha * (2 / tails)
      let value = unique[unique.length - 1].value
      for (let j = 0; j < unique.length; j++) {
        if (tail[j] <= target) {
          value = unique[j].value
          break
        }
      }
      out[String(alpha)][String(tails)] = Math.round(value * 1000) / 1000
    }
  }
  return out
}

function swap(arr, a, b) {
  const tmp = arr[a]
  arr[a] = arr[b]
  arr[b] = tmp
}

function factorial(n) {
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}

const result = {}
for (let n = 4; n <= 10; n++) result[String(n)] = criticalValues(n)

const target = fileURLToPath(new URL('../src/lib/stats/spearman-exact.json', import.meta.url))
writeFileSync(target, JSON.stringify(result, null, 2) + '\n')
console.error(`ditulis: ${target}`)
