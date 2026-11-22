import { normalCdf, normalQuantile } from '../stats/normal'
import { tCdf, tCritical } from '../stats/t'
import { fCdf, fCritical } from '../stats/f'
import { chiSquareCdf, chiSquareCritical } from '../stats/chi'
import { binomialCdf, binomialPmf } from '../stats/binomial'
import { poissonCdf, poissonPmf } from '../stats/poisson'
import { mannWhitneyCounts, mannWhitneyCritical } from '../stats/mann-whitney'
import { wilcoxonCounts, wilcoxonCritical } from '../stats/wilcoxon'
import { kruskalWallisCritical, friedmanCritical, kendallWCritical, cochranQCritical } from '../stats/approx'
import { kendallTauCriticalS } from '../stats/kendall-tau'
import { spearmanCritical } from '../stats/spearman'
import { signTestCritical } from '../stats/sign'
import { runsCritical } from '../stats/runs'
import { ksOneSampleCdf, ksOneSampleCritical, ksTwoSampleCritical } from '../stats/ks'
import type { GridSelector, LookupField, LookupResult, LookupSuggestion, TableDef } from './types'
import dwData from './data/durbin-watson.json'
import tukeyData from './data/tukey-q.json'
import dunnettData from './data/dunnett.json'
import fmaxData from './data/f-max.json'
import toleransiData from './data/toleransi.json'
import swData from './data/shapiro-wilk.json'
import lilData from './data/lillefors.json'
import { lookupCritical, type CriticalData } from './critical'


function boundarySuggestion(fields: LookupField[], input: Record<string, string>): LookupSuggestion | undefined {
  for (const field of fields) {
    if (field.min === undefined) continue
    const raw = input[field.key]
    if (raw === undefined || raw.trim() === '') continue
    const value = Number(raw)
    if (!Number.isFinite(value)) continue
    if (value < field.min) return { field: field.key, value: field.min, label: `${field.label} terdekat` }
    if (field.max !== undefined && value > field.max) return { field: field.key, value: field.max, label: `${field.label} terdekat` }
  }
  return undefined
}
function statField(key: string, label: string, min: number, max: number, step = 0.001): LookupField {
  return { key, label, kind: 'number', default: '1', min, max, step }
}
function readParams(fields: LookupField[], input: Record<string, string>): { ok: true; params: Params } | { ok: false; error: string } {
  const p: Params = {}
  for (const field of fields) {
    const raw = input[field.key] ?? field.default
    if (field.kind === 'select' && !field.options!.some(o => o.value === raw)) return { ok: false, error: `Pilihan ${field.label} tidak valid.` }
    if (!raw.trim() || !Number.isFinite(Number(raw))) return { ok: false, error: `Masukkan angka untuk ${field.label}.` }
    const value = Number(raw)
    if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) return { ok: false, error: `${field.label} harus antara ${field.min} dan ${field.max}.` }
    if (field.step === 1 && !Number.isInteger(value)) return { ok: false, error: `${field.label} harus bilangan bulat.` }
    p[field.key] = value
  }
  return { ok: true, params: p }
}
function pv(fields: LookupField[], compute: (p: Params) => number, note?: string): NonNullable<TableDef['pvalue']> {
  return {
    fields,
    lookup(input) {
      const parsed = readParams(fields, input)
      if (!parsed.ok) return { error: parsed.error }
      try {
        const value = compute(parsed.params)
        if (!Number.isFinite(value)) throw new Error('Statistik uji tidak menghasilkan p-value yang valid.')
        return { kind: 'scalar', primary: { value: Math.min(1, Math.max(0, value)), label: 'p-value' }, note }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Parameter tidak valid.'
        const suggestion = boundarySuggestion(fields, input)
        return suggestion ? { error: message, suggestion } : { error: message }
      }
    },
  }
}
const normalTail = (z: number) => 1 - normalCdf(Math.abs(z))
const tP = (t: number, df: number, tails: number) => tails === 2 ? Math.min(1, 2 * tCdf(-Math.abs(t), df)) : (t >= 0 ? 1 - tCdf(t, df) : tCdf(t, df))
const chiP = (x: number, df: number) => 1 - chiSquareCdf(x, df)
const exactP = (counts: Float64Array, k: number, tails: number) => {
  let total = 0
  for (const c of counts) total += c
  let cumulative = 0
  for (let i = 0; i <= Math.min(k, counts.length - 1); i++) cumulative += counts[i]
  const lower = cumulative / total
  return tails === 2 ? Math.min(1, 2 * lower) : lower
}
const seq = (n: number, start = 1) => Array.from({ length: n }, (_, i) => start + i)
const num = (key: string, label: string, value: number, min = 1, max = 10000, step = 1): LookupField => ({ key, label, default: String(value), min, max, step, kind: 'number' })
const select = (key: string, label: string, values: (string | number)[], value: string | number): LookupField => ({ key, label, kind: 'select', default: String(value), options: values.map(v => ({ value: String(v), label: String(v) })) })
const alpha = num('alpha', 'α (signifikansi)', 0.05, 0.0001, 0.9999, 0.0001)
const tails: LookupField = { ...select('tails', 'Ekor', [2, 1], 2), options: [{ value: '2', label: 'Dua ekor' }, { value: '1', label: 'Satu ekor' }] }
const n = num('n', 'n', 10)
const df = num('df', 'df', 30)
const pairFields = [num('n1', 'n₁', 10), num('n2', 'n₂', 10)]
const groupFields = [num('k', 'k (kelompok)', 3, 2), num('n', 'n (per kelompok/blok)', 10, 2), alpha]
const scalar = (value: number, label = 'Nilai kritis', note?: string): LookupResult => ({ kind: 'scalar', primary: { value, label }, note })
const alphas = [0.1, 0.05, 0.01]
const alphaSelector: GridSelector = { key: 'alpha', label: 'α', default: '0.05', options: alphas.map(v => ({ value: String(v), label: String(v) })) }
const fDf2Starts = [1, 11, 21, 31, 41, 51]
const fDf2Selector: GridSelector = { key: 'df2group', label: 'df₂ (kolom)', default: '11', options: fDf2Starts.map(v => ({ value: String(v), label: `${v}–${v + 9}` })) }
const tailSelector: GridSelector = { key: 'tails', label: 'Ekor', default: '2', options: tails.options! }
const approxNote = 'Aproksimasi; tanpa koreksi ties. Nilai kritis bukan p-value.'
type Params = Record<string, number>
type Compute = (p: Params) => LookupResult
interface Definition {
  id: string; symbol: string; title: string; subtitle: string; fields: LookupField[]; compute: Compute
  group?: TableDef['group']; aliases?: string[]; method: string; pvalue?: TableDef['pvalue']
  rows?: number[]; row?: string; cols?: number[]; col?: string; selectors?: GridSelector[]
}

function define(d: Definition): TableDef {
  const defaults = Object.fromEntries(d.fields.map(f => [f.key, f.default]))
  const table: TableDef = {
    id: d.id, symbol: d.symbol, name: `Tabel ${d.symbol} — ${d.title}`, subtitle: d.subtitle,
    group: d.group ?? 'parametrik', aliases: d.aliases ?? [], status: 'tersedia', fields: d.fields,
    gridSelectors: d.selectors ?? (d.col === 'alpha' ? (d.fields.some(f => f.key === 'tails') ? [tailSelector] : []) : [alphaSelector, ...(d.fields.some(f => f.key === 'tails') ? [tailSelector] : [])]),
    method: d.method, pvalue: d.pvalue,
    guide: [d.subtitle + '. Masukkan parameter pada kotak cari, lalu tekan Hitung atau Enter. Nilai α adalah peluang kesalahan tipe I, bukan tingkat kepercayaan.',
      d.fields.some(f => f.key === 'tails') ? 'Pilih satu ekor untuk hipotesis berarah, dua ekor untuk hipotesis tanpa arah. Grid mengikuti pilihan ekor yang tertulis di atasnya.' : 'Perhatikan parameter dan keterangan grid sebelum membandingkan statistik uji Anda.',
      d.method],
    lookup(input) {
      try {
        const p: Params = {}
        for (const field of d.fields) {
          const raw = input[field.key] ?? defaults[field.key]
          if (field.kind === 'select' && !field.options!.some(o => o.value === raw)) throw new Error(`Pilihan ${field.label} tidak valid.`)
          if (field.key === 'mode') continue
          if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error(`Masukkan angka untuk ${field.label}.`)
          const v = Number(raw)
          if ((field.min !== undefined && v < field.min) || (field.max !== undefined && v > field.max)) throw new Error(`${field.label} harus antara ${field.min} dan ${field.max}.`)
          if (field.step === 1 && !Number.isInteger(v)) throw new Error(`${field.label} harus bilangan bulat.`)
          p[field.key] = v
        }
        if (d.id === 'binomial' && p.k > p.n) throw new Error('k tidak boleh melebihi n.')
        const result = d.compute(p)
        if (![result.primary.value, ...(result.secondary ? [result.secondary.value] : [])].every(Number.isFinite)) throw new Error('Parameter ini tidak menghasilkan nilai finite; gunakan parameter yang lebih moderat.')
        return result
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Parameter tidak valid.'
        const suggestion = boundarySuggestion(d.fields, input)
        return suggestion ? { error: message, suggestion } : { error: message }
      }
    },
    buildGrid(controls) {
      const base = { ...defaults, ...controls }
      if (d.id === 'f') {
        const start = fDf2Starts.includes(Number(base.df2group)) ? Number(base.df2group) : 11
        const df2 = seq(10, start)
        const alpha = Number(base.alpha ?? 0.05)
        return {
          rowHeader: 'df1',
          columns: df2.map(v => ({ key: String(v), label: `df₂ ${v}` })),
          rows: seq(20).map(df1 => ({ key: String(df1), label: String(df1), cells: df2.map(v => fCritical(alpha, df1, v)) })),
          caption: `F kritis satu ekor · α = ${alpha} · baris df₁ (pembilang), kolom df₂ (penyebut) ${start}–${start + 9}`,
        }
      }
      if (d.id === 'z') {
        const zs = Array.from({ length: 61 }, (_, i) => (i - 30) / 10)
        return {
          rowHeader: 'z', columns: seq(10, 0).map(i => ({ key: String(i), label: (i / 100).toFixed(2) })),
          rows: zs.map(z => ({ key: z.toFixed(1), label: z.toFixed(1), cells: seq(10, 0).map(j => normalCdf(z + j / 100)) })),
          caption: 'P(Z ≤ z), normal standar kumulatif untuk z −3.0 sampai 3.0. Baris negatif adalah ekor kiri; Φ(−z) = 1 − Φ(z).',
        }
      }
      const rowKey = d.row ?? 'n'
      const rows = d.id === 'binomial' ? seq(Number(base.n) + 1, 0) : d.rows ?? seq(30)
      const cols = d.cols ?? [Number(base.alpha ?? 0.05)]
      return {
        rowHeader: rowKey,
        columns: cols.map(c => ({ key: String(c), label: d.col ? `${d.col} ${c === Infinity ? '∞' : c}` : 'Nilai' })),
        rows: rows.map(r => ({ key: String(r), label: r === Infinity ? '∞' : String(r), cells: cols.map(c => {
          // Derajat kebebasan tak hingga memakai limit normal.
          if (r === Infinity && d.id === 't') return normalQuantile(1 - c / Number(base.tails))
          const result = table.lookup({ ...base, [rowKey]: String(r), ...(d.col ? { [d.col]: String(c) } : {}) })
          return 'error' in result ? null : result.primary.value
        }) })),
        caption: `${d.title} · ${Object.entries(base).filter(([k]) => k !== rowKey && k !== d.col && k !== 'mode').map(([k, v]) => `${k} = ${v}`).join(' · ')}${d.id === 'runs' ? ' · Grid: batas bawah; batas atas di kotak cari.' : ''}`,
      }
    },
  }
  return table
}
const non = 'nonparametrik' as const
const definitions: Definition[] = [
  { id: 'z', symbol: 'z', title: 'Normal standar', subtitle: 'Nilai kritis dan peluang distribusi normal standar', fields: [alpha, tails], compute: p => scalar(normalQuantile(1 - p.alpha / p.tails), 'z kritis'), pvalue: pv([statField('stat', 'z', -10, 10), tails], p => p.tails === 2 ? Math.min(1, 2 * normalTail(p.stat)) : (p.stat >= 0 ? normalTail(p.stat) : normalCdf(p.stat)), 'Satu ekor mengikuti arah tanda z.'), method: 'Invers CDF normal standar untuk kotak cari. Grid menampilkan peluang kumulatif Φ(z) dari z = −3.0 sampai 3.0, termasuk nilai negatif, bukan nilai kritis.', selectors: [] },
  { id: 't', symbol: 't', title: 'Student', subtitle: 'Nilai kritis t berdasarkan derajat kebebasan', fields: [df, alpha, tails], compute: p => scalar(tCritical(p.alpha, p.df, p.tails as 1 | 2), 't kritis'), pvalue: pv([statField('stat', 't', -1000, 1000), df, tails], p => tP(p.stat, p.df, p.tails)), method: 'Invers incomplete beta untuk distribusi Student t.', row: 'df', rows: [...seq(100), 120, 200, Infinity], col: 'alpha', cols: [0.1, 0.05, 0.025, 0.01] },
  { id: 'f', symbol: 'F', title: 'Fisher', subtitle: 'Nilai kritis F untuk rasio varians dan ANOVA', fields: [num('df1', 'df₁ (pembilang)', 5), num('df2', 'df₂ (penyebut)', 20), alpha], compute: p => scalar(fCritical(p.alpha, p.df1, p.df2), 'F kritis'), pvalue: pv([statField('stat', 'F', 0, 100000), num('df1', 'df₁ (pembilang)', 5), num('df2', 'df₂ (penyebut)', 20)], p => 1 - fCdf(p.stat, p.df1, p.df2), 'Ekor kanan.'), method: 'Invers incomplete beta; ekor kanan. Baris df₁, kolom df₂. Gunakan pemilih df₂ untuk berpindah blok 10 kolom.', row: 'df1', rows: seq(20), col: 'df2', cols: seq(10), selectors: [alphaSelector, fDf2Selector], aliases: ['anova'] },
  { id: 'chi-square', symbol: 'χ²', title: 'Chi-square', subtitle: 'Nilai kritis chi-square untuk derajat kebebasan tertentu', fields: [num('df', 'df', 10), alpha], compute: p => scalar(chiSquareCritical(p.alpha, p.df), 'χ² kritis'), pvalue: pv([statField('stat', 'χ²', 0, 100000), num('df', 'df', 10), ], p => chiP(p.stat, p.df), 'Ekor kanan.'), method: 'Invers incomplete gamma; ekor kanan.', row: 'df', rows: seq(100), col: 'alpha', cols: alphas, aliases: ['chi kuadrat', 'chi squared', 'chi2', 'x2', 'khi', 'khi kuadrat'] },
  { id: 'r-pearson', symbol: 'r', title: 'Pearson', subtitle: 'Batas korelasi Pearson; df = n − 2', fields: [df, alpha, tails], compute: p => { const t = tCritical(p.alpha, p.df, p.tails as 1 | 2); return scalar(t / Math.sqrt(t * t + p.df), '|r| kritis') }, method: 'Transformasi t: r = t / √(t² + df). Asumsi normalitas bivariat.', pvalue: pv([{ ...statField('stat', 'r', -0.999999, 0.999999), default: '0.3' }, df, tails], p => { if (Math.abs(p.stat) >= 1) throw new Error('|r| harus kurang dari 1.'); const t = p.stat * Math.sqrt(p.df / (1 - p.stat * p.stat)); return tP(t, p.df, p.tails) }, 'Transformasi t dari r.'), row: 'df', rows: seq(100), col: 'alpha', cols: alphas },
  { id: 'binomial', symbol: 'B', title: 'Binomial', subtitle: 'Peluang tepat dan kumulatif untuk n percobaan Bernoulli', fields: [num('n', 'n', 10, 1, 1000), num('p', 'p', 0.5, 0, 1, 0.001), num('k', 'k', 3, 0, 1000)], compute: p => ({ kind: 'probability', primary: { value: binomialPmf(p.n, p.p, p.k), label: 'P(X = k)' }, secondary: { value: binomialCdf(p.n, p.p, p.k), label: 'P(X ≤ k)' } }), method: 'Distribusi binomial; percobaan independen dengan peluang sukses p konstan. Grid: P(X = k).', row: 'k', col: 'p', cols: [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95], selectors: [{ key: 'n', label: 'n', default: '10', options: seq(24, 2).map(v => ({ value: String(v), label: String(v) })) }] },
  { id: 'poisson', symbol: 'λ', title: 'Poisson', subtitle: 'Peluang jumlah kejadian dengan rata-rata λ', fields: [num('lambda', 'λ', 3, 0.01, 500, 0.01), num('k', 'k', 2, 0, 1000)], compute: p => ({ kind: 'probability', primary: { value: poissonPmf(p.lambda, p.k), label: 'P(X = k)' }, secondary: { value: poissonCdf(p.lambda, p.k), label: 'P(X ≤ k)' } }), method: 'Distribusi Poisson. Grid menampilkan peluang tepat P(X = k).', row: 'k', rows: seq(21, 0), col: 'lambda', cols: [0.1, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], selectors: [] },
  { id: 'mann-whitney', symbol: 'U', title: 'Mann-Whitney', subtitle: 'Batas bawah U untuk dua sampel independen tanpa ties', group: non, fields: [...pairFields, alpha, tails], compute: p => {
    if (p.n1 <= 20 && p.n2 <= 20) {
      if (p.alpha / p.tails < Math.exp(-logChoose(p.n1 + p.n2, p.n1))) throw new Error('Tidak ada daerah penolakan eksak pada α dan ukuran sampel ini.')
      return scalar(mannWhitneyCritical(p.n1, p.n2, p.alpha, p.tails as 1 | 2), 'U kritis (batas bawah)')
    }
    return scalar(Math.max(0, Math.floor(p.n1 * p.n2 / 2 - normalQuantile(1 - p.alpha / p.tails) * Math.sqrt(p.n1 * p.n2 * (p.n1 + p.n2 + 1) / 12) - 0.5)), 'U kritis (batas bawah)', approxNote)
  }, pvalue: pv([statField('stat', 'U', 0, 100000), ...pairFields, tails], p => {
    const maxU = p.n1 * p.n2
    if (p.stat > maxU) throw new Error(`U harus antara 0 dan ${maxU}.`)
    if (p.n1 <= 20 && p.n2 <= 20) return exactP(mannWhitneyCounts(p.n1, p.n2), Math.round(p.stat), p.tails)
    const z = (p.stat - maxU / 2 + 0.5) / Math.sqrt(maxU * (p.n1 + p.n2 + 1) / 12)
    return p.tails === 2 ? Math.min(1, 2 * normalTail(z)) : normalCdf(z)
  }, 'Eksak n₁,n₂ ≤ 20; aproksimasi normal dengan koreksi kontinuitas di atasnya.'), method: 'Eksak untuk n1,n2 ≤ 20; di atasnya aproksimasi normal dengan koreksi kontinuitas. Tolak jika U minimum ≤ batas bawah. Tanpa ties.', row: 'n1', rows: seq(20), col: 'n2', cols: seq(20), aliases: ['mann whitney', 'u', 'wilcoxon rank sum', 'mannwhitney'] },
  { id: 'wilcoxon', symbol: 'T', title: 'Wilcoxon', subtitle: 'Batas jumlah peringkat bertanda terkecil; abaikan selisih nol', group: non, fields: [n, alpha, tails], compute: p => {
    if (p.n <= 25 && p.alpha / p.tails < 2 ** -p.n) throw new Error('Tidak ada daerah penolakan eksak pada α dan n ini.')
    return scalar(p.n <= 25 ? wilcoxonCritical(p.n, p.alpha, p.tails as 1 | 2) : Math.max(0, Math.floor(p.n * (p.n + 1) / 4 - normalQuantile(1 - p.alpha / p.tails) * Math.sqrt(p.n * (p.n + 1) * (2 * p.n + 1) / 24) - 0.5)), 'T kritis', p.n > 25 ? approxNote : undefined)
  }, pvalue: pv([statField('stat', 'T', 0, 100000), n, tails], p => {
    const maxT = p.n * (p.n + 1) / 2
    if (p.stat > maxT) throw new Error(`T harus antara 0 dan ${maxT}.`)
    if (p.n <= 25) return exactP(wilcoxonCounts(p.n), Math.round(p.stat), p.tails)
    const z = (p.stat - maxT / 2 + 0.5) / Math.sqrt(p.n * (p.n + 1) * (2 * p.n + 1) / 24)
    return p.tails === 2 ? Math.min(1, 2 * normalCdf(z)) : normalCdf(z)
  }, 'Eksak n ≤ 25; aproksimasi normal dengan koreksi kontinuitas di atasnya.'), method: 'Eksak n ≤ 25; aproksimasi normal di atasnya. Tanpa ties dan tanpa selisih nol. Tolak jika T minimum ≤ batas.', rows: seq(21, 5), col: 'alpha', cols: [0.05, 0.01] },
  ...([
    ['kruskal-wallis', 'H', 'Kruskal-Wallis', kruskalWallisCritical], ['friedman', 'χ²r', 'Friedman', friedmanCritical], ['kendall-w', 'W', 'Kendall concordance', kendallWCritical], ['cochran-q', 'Q', 'Cochran', cochranQCritical],
  ] as const).map(([id, symbol, title, fn]): Definition => ({ id, symbol, title, subtitle: `Nilai kritis ${title} berbasis aproksimasi chi-square`, group: non, fields: groupFields, compute: p => scalar(fn(p.k, p.n, p.alpha), `${symbol} kritis`, approxNote), method: `Aproksimasi χ²; ${id === 'kendall-w' ? 'W = χ² / [k(n−1)]. k adalah penilai, n adalah objek.' : 'df = k − 1. n adalah jumlah observasi per kelompok atau blok.'} Tidak disarankan untuk sampel sangat kecil.`, pvalue: pv([statField('stat', symbol, 0, 100000), ...groupFields.slice(0, 2)], p => {
    const chi = id === 'kendall-w' ? p.n * (p.k - 1) * p.stat : p.stat
    return chiP(chi, p.k - 1)
  }, 'Aproksimasi chi-square; df = k − 1.'), row: 'k', rows: seq(8, 3), col: 'n', cols: seq(id === 'friedman' || id === 'cochran-q' ? 29 : 9, 2) })),
  { id: 'spearman', symbol: 'ρ', title: 'Spearman', subtitle: 'Nilai kritis korelasi peringkat tanpa ties', group: non, fields: [{ ...n, default: '10', min: 4 }, alpha, tails], compute: p => scalar(spearmanCritical(p.n, p.alpha, p.tails as 1 | 2), '|ρ| kritis', p.n > 10 ? 'Aproksimasi t.' : 'Permutasi eksak tanpa ties.'), method: 'Distribusi permutasi eksak n ≤ 10; transformasi Student t untuk n > 10. Tidak berlaku untuk ties.', pvalue: pv([{ ...statField('stat', 'ρ', -0.999999, 0.999999), default: '0.3' }, { ...n, default: '10', min: 4 }, tails], p => {
    if (Math.abs(p.stat) >= 1) throw new Error('|ρ| harus kurang dari 1.')
    const t = p.stat * Math.sqrt((p.n - 2) / (1 - p.stat * p.stat))
    return tP(t, p.n - 2, p.tails)
  }, 'Aproksimasi t; untuk n ≤ 10 tabel nilai kritis memakai permutasi eksak.'), rows: seq(27, 4), col: 'alpha', cols: alphas },
  { id: 'kendall-tau', symbol: 'τ', title: 'Kendall tau', subtitle: 'Batas korelasi Kendall tau tanpa ties', group: non, fields: [{ ...n, min: 4 }, alpha, tails], compute: p => scalar(kendallTauCriticalS(p.n, p.alpha, p.tails as 1 | 2) / (p.n * (p.n - 1) / 2), '|τ| kritis', approxNote), method: 'Aproksimasi normal untuk statistik S, lalu τ = S / [n(n−1)/2]. Tanpa ties; sampel kecil tidak eksak.', pvalue: pv([{ ...statField('stat', 'τ', -1, 1), default: '0.3' }, { ...n, min: 4 }, tails], p => {
    const sd = Math.sqrt(p.n * (p.n - 1) * (2 * p.n + 5) / 18)
    const z = (p.stat * p.n * (p.n - 1) / 2) / sd
    return p.tails === 2 ? Math.min(1, 2 * normalTail(z)) : (z >= 0 ? normalTail(z) : normalCdf(z))
  }, 'Aproksimasi normal tanpa koreksi kontinuitas.'), rows: seq(27, 4), col: 'alpha', cols: alphas },
  { id: 'ks-satu-sampel', symbol: 'D₁', title: 'K-S satu sampel', subtitle: 'Batas jarak terhadap distribusi kontinu yang ditentukan sebelumnya', group: non, fields: [{ ...n, default: '20', max: 100000 }, alpha], compute: p => scalar(p.n <= 100 ? ksOneSampleCritical(p.n, p.alpha) : Math.sqrt(-0.5 * Math.log(p.alpha / 2)) / Math.sqrt(p.n), 'D kritis', p.n > 100 ? 'Aproksimasi asimptotik.' : undefined), method: 'CDF eksak Marsaglia–Tsang–Wang untuk n ≤ 100; asimptotik untuk n > 100. Parameter distribusi harus ditentukan, bukan diestimasi dari sampel.', pvalue: pv([statField('stat', 'D', 0, 1), { ...n, default: '20', max: 100000 }], p => 1 - ksOneSampleCdf(p.n, p.stat), 'Ekor kanan; parameter distribusi harus ditentukan.'), rows: seq(50), col: 'alpha', cols: alphas, aliases: ['kolmogorov smirnov'] },
  { id: 'ks-dua-sampel', symbol: 'D₂', title: 'K-S dua sampel', subtitle: 'Batas jarak dua fungsi distribusi empiris', group: non, fields: [...pairFields, { ...alpha, kind: 'select', options: [0.05, 0.01].map(v => ({ value: String(v), label: String(v) })) }], compute: p => scalar(ksTwoSampleCritical(p.n1, p.n2, p.alpha), 'D kritis', 'Asimptotik; jika D kritis > 1, daerah penolakan tidak terjangkau.'), method: 'Aproksimasi asimptotik dua sisi, c = 1.36 (α=.05) atau 1.63 (α=.01). Bukan tabel eksak sampel kecil.', pvalue: pv([statField('stat', 'D', 0, 1), ...pairFields], p => {
    const lambda = Math.sqrt(p.n1 * p.n2 / (p.n1 + p.n2)) * p.stat
    if (lambda < 1e-4) return 1
    let sum = 0
    for (let j = 1; j <= 100; j++) sum += (j % 2 ? 1 : -1) * Math.exp(-2 * j * j * lambda * lambda)
    return Math.min(1, Math.max(0, 2 * sum))
  }, 'Asimptotik dua sisi (distribusi Kolmogorov).'), row: 'n1', rows: seq(20), col: 'n2', cols: seq(20), selectors: [{ ...alphaSelector, options: alphaSelector.options.filter(o => o.value !== '0.1') }], aliases: ['kolmogorov smirnov'] },
  { id: 'sign-mcnemar', symbol: 'S', title: 'Sign test & McNemar', subtitle: 'Batas binomial untuk tanda atau pasangan diskordan', group: non, fields: [{ ...select('mode', 'Mode', ['sign', 'mcnemar'], 'sign'), options: [{ value: 'sign', label: 'Sign test' }, { value: 'mcnemar', label: 'McNemar eksak' }] }, n, alpha, tails], compute: p => { if (p.alpha / p.tails < 2 ** -p.n) throw new Error('Tidak ada daerah penolakan eksak pada α dan n ini.'); return scalar(signTestCritical(p.n, p.alpha, p.tails as 1 | 2), 'Batas bawah jumlah tanda') }, method: 'Binomial eksak p = 0.5. McNemar: n = pasangan diskordan, statistik = jumlah diskordan arah yang lebih kecil (dua ekor). Sign: n = selisih bukan nol. Tolak jika jumlah ≤ batas.', pvalue: pv([statField('stat', 'k', 0, 100000), n, tails], p => {
    if (!Number.isInteger(p.stat) || p.stat > p.n) throw new Error('k harus bilangan bulat antara 0 dan n.')
    const lower = binomialCdf(p.n, 0.5, p.stat)
    const upper = 1 - binomialCdf(p.n, 0.5, p.stat - 1)
    return p.tails === 2 ? Math.min(1, 2 * Math.min(lower, upper)) : lower
  }, 'Binomial eksak p = 0.5; satu ekor memakai ekor bawah.'), rows: seq(50), col: 'alpha', cols: alphas },
  { id: 'runs', symbol: 'R', title: 'Runs Wald-Wolfowitz', subtitle: 'Batas daerah penerimaan jumlah runs pada urutan dua kategori', group: non, fields: [...pairFields, alpha], compute: p => { const r = runsCritical(p.n1, p.n2, p.alpha); return { kind: 'pair', primary: { value: r.lower, label: 'Batas bawah penerimaan' }, secondary: { value: r.upper, label: 'Batas atas penerimaan' }, note: 'Aproksimasi normal; tolak di luar interval. Tidak andal pada sampel kecil.' } }, method: 'Aproksimasi normal, tanpa koreksi kontinuitas. Kedua angka adalah batas penerimaan (tolak di luarnya), bukan nilai kritis eksak.', pvalue: pv([{ ...statField('stat', 'R', 2, 100000), default: '11' }, ...pairFields], p => {
    const mean = 2 * p.n1 * p.n2 / (p.n1 + p.n2) + 1
    const variance = 2 * p.n1 * p.n2 * (2 * p.n1 * p.n2 - p.n1 - p.n2) / ((p.n1 + p.n2) ** 2 * (p.n1 + p.n2 - 1))
    if (!(variance > 0)) throw new Error('Ukuran sampel terlalu kecil untuk aproksimasi normal.')
    return Math.min(1, 2 * normalTail((p.stat - mean) / Math.sqrt(variance)))
  }, 'Aproksimasi normal dua sisi; tidak andal pada sampel kecil.'), row: 'n1', rows: seq(20), col: 'n2', cols: seq(20) },
]
function logChoose(n: number, k: number) { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s }

// --------------------------------------------------- tabel kritikal terhitung
// Angka dibangkitkan scripts/build-critical-tables.py dari definisi distribusi
// dan dicocokkan dengan nilai jangkar tabel terbit; lihat `method`.
const alpha2 = (values: number[]): LookupField => ({ key: 'alpha', label: 'α (signifikansi)', kind: 'select', default: '0.05', options: values.map(v => ({ value: String(v), label: String(v) })) })
const numField = (key: string, label: string, def: number, min: number, max: number): LookupField => ({ key, label, kind: 'number', default: String(def), min, max, step: 1 })
const alphaGrid = (values: number[]): GridSelector => ({ key: 'alpha', label: 'α', default: '0.05', options: values.map(v => ({ value: String(v), label: String(v) })) })

interface CriticalConfig {
  data: CriticalData; symbol: string; title: string; subtitle: string
  fields: LookupField[]; labels: [string, string?]; rows: string; rowLabel: string
  cols: string; colLabel: string; selectors: GridSelector[]
  group?: TableDef['group']; aliases?: string[]
}

function criticalTable(cfg: CriticalConfig): TableDef {
  const { data } = cfg
  const defaults = Object.fromEntries(cfg.fields.map(f => [f.key, f.default]))
  const isPair = cfg.labels[1] !== undefined
  return {
    id: data.id, symbol: cfg.symbol, name: `Tabel ${cfg.symbol} — ${cfg.title}`, subtitle: cfg.subtitle,
    group: cfg.group ?? 'parametrik', aliases: cfg.aliases ?? [], status: 'tersedia',
    fields: cfg.fields, gridSelectors: cfg.selectors,
    guide: [
      `${cfg.subtitle}. Masukkan parameter, lalu tekan Hitung atau Enter. Nilai di antara titik tabel diinterpolasi dan diberi awalan ≈.`,
      isPair ? `Hasil berupa pasangan ${cfg.labels[0]} dan ${cfg.labels[1]}; keduanya dibaca bersama, bukan p-value.` : 'Nilai yang ditampilkan adalah nilai kritis pada α yang dipilih, bukan tingkat signifikansi hasil uji.',
      'Gunakan kotak cari untuk parameter yang tidak tercantum pada header grid; pilihan di atas grid hanya mengubah tampilan.',
      data.method,
    ],
    method: `${data.method} Sumber acuan: ${data.source}`,
    lookup(input) {
      try {
        const query: Record<string, string> = {}
        for (const field of cfg.fields) {
          const raw = input[field.key] ?? defaults[field.key]
          if (field.kind === 'select' && !field.options!.some(o => o.value === raw)) throw new Error(`Pilihan ${field.label} tidak valid.`)
          if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error(`Masukkan angka untuk ${field.label}.`)
          const value = Number(raw)
          if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) throw new Error(`${field.label} harus antara ${field.min} dan ${field.max}.`)
          if (field.step === 1 && !Number.isInteger(value)) throw new Error(`${field.label} harus bilangan bulat.`)
          query[field.key] = raw
        }
        const out = lookupCritical(data, query)
        if ('error' in out) return out.suggestion ? { error: out.error, suggestion: out.suggestion } : { error: out.error }
        return {
          kind: isPair ? 'pair' : 'scalar',
          primary: { value: out.values[0], label: cfg.labels[0] },
          secondary: isPair ? { value: out.values[1], label: cfg.labels[1]! } : undefined,
          interpolated: out.interpolated, note: out.note,
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Parameter tidak valid.'
        const suggestion = boundarySuggestion(cfg.fields, input)
        return suggestion ? { error: message, suggestion } : { error: message }
      }
    },
    buildGrid(controls) {
      const merged = { ...defaults, ...controls }
      const rowValues = data.axisValues[cfg.rows]
      const cols = data.axisValues[cfg.cols]
      return {
        rowHeader: cfg.rowLabel,
        columns: cols.map(c => ({ key: String(c), label: `${cfg.colLabel} ${c}` })),
        rows: rowValues.map(r => ({
          key: String(r), label: String(r),
          cells: cols.map(c => {
            const key = data.axes.map(axis => axis === cfg.rows ? r : axis === cfg.cols ? c : merged[axis]).join('|')
            const cell = data.cells[key]
            if (cell === undefined || cell === null) return null
            return Array.isArray(cell) ? cell[0] : cell
          }),
        })),
        caption: [cfg.title, ...cfg.selectors.map(x => `${x.label} = ${merged[x.key]}`), ...(isPair ? [`sel = ${cfg.labels[0]} (${cfg.labels[1]} di kotak cari)`] : [])].join(' · '),
      }
    },
  }
}

const CRITICAL_TABLES: TableDef[] = [
  criticalTable({
    data: dwData as CriticalData, symbol: 'd', title: 'Durbin-Watson', subtitle: 'Batas dL dan dU untuk autokorelasi residual orde satu',
    fields: [numField('n', 'n (observasi)', 15, 6, 100), numField('k', 'k (prediktor, tanpa intersep)', 1, 1, 5), alpha2([0.05, 0.01])],
    labels: ['dL (batas bawah)', 'dU (batas atas)'], rows: 'n', rowLabel: 'n', cols: 'k', colLabel: 'k =', selectors: [alphaGrid([0.05, 0.01])],
    aliases: ['durbin watson', 'autokorelasi', 'dw'],
  }),
  criticalTable({
    data: tukeyData as CriticalData, symbol: 'q', title: 'Tukey HSD', subtitle: 'Nilai kritis studentized range untuk perbandingan berganda',
    fields: [numField('k', 'k (jumlah kelompok)', 3, 2, 10), numField('df', 'df (galat)', 10, 1, 60), alpha2([0.05, 0.01])],
    labels: ['q kritis'], rows: 'k', rowLabel: 'k', cols: 'df', colLabel: 'df =', selectors: [alphaGrid([0.05, 0.01])],
    aliases: ['tukey', 'hsd', 'studentized range', 'anova'],
  }),
  criticalTable({
    data: dunnettData as CriticalData, symbol: 'd', title: 'Dunnett', subtitle: 'Nilai kritis dua sisi untuk beberapa perlakuan dibanding satu kontrol',
    fields: [numField('k', 'k (termasuk kontrol)', 3, 2, 10), numField('df', 'df (galat)', 10, 1, 60), alpha2([0.05, 0.01])],
    labels: ['d kritis (dua sisi)'], rows: 'k', rowLabel: 'k', cols: 'df', colLabel: 'df =', selectors: [alphaGrid([0.05, 0.01])],
    aliases: ['dunnett', 'kontrol', 'multiple comparison'],
  }),
  criticalTable({
    data: fmaxData as CriticalData, symbol: 'Fmax', title: 'Hartley F-max', subtitle: 'Nilai kritis rasio varians terbesar terhadap terkecil',
    fields: [numField('k', 'k (jumlah kelompok)', 3, 2, 10), numField('df', 'df (per kelompok)', 10, 1, 60), alpha2([0.05, 0.01])],
    labels: ['Fmax kritis'], rows: 'k', rowLabel: 'k', cols: 'df', colLabel: 'df =', selectors: [alphaGrid([0.05, 0.01])],
    aliases: ['hartley', 'fmax', 'homogenitas varians'],
  }),
  criticalTable({
    data: toleransiData as CriticalData, symbol: 'k', title: 'Faktor toleransi', subtitle: 'Faktor k untuk interval toleransi normal',
    fields: [
      numField('n', 'n (sampel)', 10, 2, 50),
      { key: 'gamma', label: 'γ (keyakinan)', kind: 'select', default: '0.95', options: [0.9, 0.95, 0.99].map(v => ({ value: String(v), label: String(v) })) },
      { key: 'P', label: 'P (proporsi tercakup)', kind: 'select', default: '0.99', options: [0.9, 0.95, 0.99].map(v => ({ value: String(v), label: String(v) })) },
      { key: 'sisi', label: 'Sisi', kind: 'select', default: '1', options: [{ value: '1', label: 'Satu sisi' }, { value: '2', label: 'Dua sisi' }] },
    ],
    labels: ['k'], rows: 'n', rowLabel: 'n', cols: 'P', colLabel: 'P =',
    selectors: [
      { key: 'gamma', label: 'γ', default: '0.95', options: [0.9, 0.95, 0.99].map(v => ({ value: String(v), label: String(v) })) },
      { key: 'sisi', label: 'Sisi', default: '1', options: [{ value: '1', label: 'Satu sisi' }, { value: '2', label: 'Dua sisi' }] },
    ],
    aliases: ['toleransi', 'tolerance interval', 'k factor'],
  }),
  criticalTable({
    data: swData as CriticalData, symbol: 'W', title: 'Shapiro-Wilk', subtitle: 'Nilai kritis W untuk uji normalitas', group: non,
    fields: [numField('n', 'n', 10, 3, 50), alpha2([0.01, 0.05, 0.1])],
    labels: ['W kritis'], rows: 'n', rowLabel: 'n', cols: 'alpha', colLabel: 'α =', selectors: [],
    aliases: ['shapiro', 'normalitas', 'sw'],
  }),
  criticalTable({
    data: lilData as CriticalData, symbol: 'L', title: 'Lilliefors', subtitle: 'Nilai kritis D untuk normalitas dengan parameter diestimasi', group: non,
    fields: [numField('n', 'n', 10, 4, 30), alpha2([0.01, 0.05, 0.1, 0.2])],
    labels: ['D kritis'], rows: 'n', rowLabel: 'n', cols: 'alpha', colLabel: 'α =', selectors: [],
    aliases: ['lilliefors', 'lillefors', 'kolmogorov smirnov', 'normalitas'],
  }),
]

export const TABLES: TableDef[] = [...definitions.map(define), ...CRITICAL_TABLES].sort((a, b) => a.group === b.group ? 0 : a.group === 'parametrik' ? -1 : 1)
export const getTable = (id: string) => TABLES.find(t => t.id === id)
const normalize = (s: string) => s
  .toLowerCase()
  .replace(/χ²/g, ' chi square ')
  .replace(/[χ]/g, ' chi ')
  .replace(/τ/g, ' tau ')
  .replace(/ρ/g, ' rho ')
  .replace(/λ/g, ' lambda ')
  .replace(/α/g, ' alpha ')
  .replace(/²/g, '2')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

function subsequenceScore(text: string, needle: string) {
  let at = 0
  let gaps = 0
  let last = -1
  for (let i = 0; i < text.length && at < needle.length; i++) {
    if (text[i] !== needle[at]) continue
    if (last >= 0) gaps += i - last - 1
    last = i
    at++
  }
  return at === needle.length ? Math.max(1, 30 - gaps) : 0
}

function matchScore(table: (typeof TABLES)[number], query: string) {
  const fields = [table.name, table.symbol, table.id, ...table.aliases].map(normalize)
  let best = 0
  for (const text of fields) {
    if (text === query) best = Math.max(best, 100)
    else if (text.startsWith(query)) best = Math.max(best, 80)
    else if (text.includes(query)) best = Math.max(best, 60)
    else best = Math.max(best, subsequenceScore(text, query))
  }
  return best
}

export function searchTables(query: string, limit = 8) {
  const q = normalize(query)
  if (!q) return TABLES.slice(0, limit)
  return TABLES
    .map(table => ({ table, score: matchScore(table, q) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.table)
}
