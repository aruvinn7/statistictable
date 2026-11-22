import { tCritical } from './t'
import spearmanExact from './spearman-exact.json'

type AlphaKey = '0.1' | '0.05' | '0.025' | '0.01' | '0.005'
type TailKey = '1' | '2'
type ExactTable = Record<string, Record<AlphaKey, Record<TailKey, number>>>

const EXACT = spearmanExact as ExactTable
const MAX_EXACT_N = 10

export function spearmanCritical(n: number, alpha: number, tails: 1 | 2): number {
  if (!Number.isInteger(n) || n < 4) throw new RangeError('n harus bilangan bulat >= 4')
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha harus di antara 0 dan 1')

  if (n <= MAX_EXACT_N) {
    const table = EXACT[String(n)]
    const key = alpha.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') as AlphaKey
    const exact = table?.[key]?.[String(tails) as TailKey]
    if (exact !== undefined) return exact
  }

  // Di atas n = 10 tabel eksak tidak tersedia; pakai aproksimasi t.
  const t = tCritical(alpha, n - 2, tails)
  return t / Math.sqrt(t * t + (n - 2))
}
