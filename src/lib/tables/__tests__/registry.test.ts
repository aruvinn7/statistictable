import { describe, expect, test } from 'vitest'
import { TABLES, getTable, searchTables } from '../registry'
import { lookupCritical } from '../critical'
import dwData from '../data/durbin-watson.json'

describe('registry tabel', () => {
  test('26 id unik dan 19 modul hitung tersedia', () => {
    expect(TABLES).toHaveLength(26)
    expect(new Set(TABLES.map(t => t.id)).size).toBe(26)
    expect(TABLES.filter(t => t.status === 'tersedia').length).toBeGreaterThanOrEqual(19)
  })
  test('pencarian alias, simbol, dan fuzzy', () => {
    expect(searchTables('mann whitney').map(t => t.id)).toContain('mann-whitney')
    expect(searchTables('chi kuadrat').map(t => t.id)).toContain('chi-square')
    expect(searchTables('x2').map(t => t.id)).toContain('chi-square')
    expect(searchTables('chikuadrat').map(t => t.id)).toContain('chi-square')
    expect(searchTables('mannwhitney').map(t => t.id)).toContain('mann-whitney')
  })
  test('p-value dari statistik uji cocok dengan alpha', () => {
    const cases: [string, Record<string, string>, number][] = [
      ['z', { stat: '1.959964', tails: '2' }, 0.05],
      ['t', { stat: '2.042', df: '30', tails: '2' }, 0.05],
      ['f', { stat: '2.711', df1: '5', df2: '20' }, 0.05],
      ['chi-square', { stat: '18.307', df: '10' }, 0.05],
      ['r-pearson', { stat: '0.349', df: '30', tails: '2' }, 0.05],
      ['kruskal-wallis', { stat: '5.991', k: '3', n: '10' }, 0.05],
      ['sign-mcnemar', { stat: '1', n: '10', tails: '2' }, 0.0215],
    ]
    for (const [id, input, expected] of cases) {
      const pvalue = getTable(id)!.pvalue
      expect(pvalue, id).toBeDefined()
      const out = pvalue!.lookup(input)
      expect('error' in out, id).toBe(false)
      if (!('error' in out)) expect(out.primary.value, id).toBeCloseTo(expected, 3)
    }
  })
  test('mode p-value tersedia dan defaultnya valid', () => {
    for (const table of TABLES) {
      if (!table.pvalue) continue
      const out = table.pvalue.lookup(Object.fromEntries(table.pvalue.fields.map(f => [f.key, f.default])))
      expect('error' in out, table.id).toBe(false)
      if (!('error' in out)) {
        expect(out.primary.value, table.id).toBeGreaterThanOrEqual(0)
        expect(out.primary.value, table.id).toBeLessThanOrEqual(1)
      }
    }
  })
  test('nilai t buku dan validasi', () => {
    const table = getTable('t')!
    const out = table.lookup({ df: '30', alpha: '0.05', tails: '2' })
    expect('primary' in out && out.primary.value).toBeCloseTo(2.042, 3)
    for (const df of ['abc', '', '2.5', '-1', 'Infinity']) {
      expect(table.lookup({ df, alpha: '0.05', tails: '2' })).toHaveProperty('error')
    }
    expect(table.lookup({ df: '30', alpha: '1', tails: '2' })).toHaveProperty('error')
    expect(table.lookup({ df: '30', alpha: '0.05', tails: '3' })).toHaveProperty('error')
  })
  test('semua default tersedia menghasilkan nilai finite dan grid', () => {
    for (const table of TABLES.filter(t => t.status === 'tersedia')) {
      const result = table.lookup(Object.fromEntries(table.fields.map(f => [f.key, f.default])))
      expect('error' in result, table.id).toBe(false)
      if ('primary' in result) expect(Number.isFinite(result.primary.value), table.id).toBe(true)
      const grid = table.buildGrid(Object.fromEntries(table.gridSelectors.map(f => [f.key, f.default])))
      expect(grid.rows.length, table.id).toBeGreaterThan(0)
      expect(grid.rows.every(r => r.cells.length === grid.columns.length), table.id).toBe(true)
    }
  })
  test('dua ekor dan peluang dilabeli secara eksplisit', () => {
    const r = getTable('binomial')!.lookup({ n: '10', p: '0.5', k: '3' })
    expect('primary' in r && r.primary.value).toBeCloseTo(0.1171875, 7)
    expect('secondary' in r && r.secondary?.value).toBeCloseTo(0.171875, 7)
    expect(getTable('binomial')!.lookup({ n: '10', p: '2', k: '3' })).toHaveProperty('error')
  })
})

describe('tujuh tabel kritikal terhitung', () => {
  const value = (id: string, q: Record<string, string>) => {
    const out = getTable(id)!.lookup(q)
    if ('error' in out) throw new Error(`${id}: ${out.error}`)
    return out
  }
  test('nilai jangkar tabel terbit', () => {
    const dw = value('durbin-watson', { n: '15', k: '1', alpha: '0.05' })
    expect(dw.kind).toBe('pair')
    expect(dw.primary.value).toBeCloseTo(1.08, 1)
    expect(dw.secondary!.value).toBeCloseTo(1.36, 1)
    expect(typeof value('durbin-watson', { n: '50', k: '4', alpha: '0.05' }).primary.value).toBe('number')
    expect(value('tukey-q', { k: '3', df: '10', alpha: '0.05' }).primary.value).toBeCloseTo(3.88, 1)
    expect(value('tukey-q', { k: '5', df: '20', alpha: '0.05' }).primary.value).toBeCloseTo(4.23, 1)
    expect(value('dunnett', { k: '2', df: '30', alpha: '0.05' }).primary.value).toBeCloseTo(2.042, 2)
    expect(value('dunnett', { k: '3', df: '10', alpha: '0.05' }).primary.value).toBeCloseTo(2.57, 1)
    expect(value('f-max', { k: '3', df: '10', alpha: '0.05' }).primary.value).toBeCloseTo(4.85, 1)
    expect(value('toleransi', { n: '10', gamma: '0.95', P: '0.99', sisi: '1' }).primary.value).toBeCloseTo(3.981, 2)
    expect(value('shapiro-wilk', { n: '10', alpha: '0.05' }).primary.value).toBeCloseTo(0.842, 1)
    expect(value('lillefors', { n: '10', alpha: '0.05' }).primary.value).toBeCloseTo(0.258, 1)
  })
  test('interpolasi ditandai dan berada di antara tetangga', () => {
    const data = dwData as never
    const a = lookupCritical(data, { n: 15, k: 1, alpha: 0.05 })
    const b = lookupCritical(data, { n: 17, k: 1, alpha: 0.05 })
    const mid = lookupCritical(data, { n: 16.5, k: 1, alpha: 0.05 })
    if ('error' in a || 'error' in b || 'error' in mid) throw new Error('lookup gagal')
    expect(mid.interpolated).toBe(true)
    expect(mid.values[0]).toBeGreaterThan(Math.min(a.values[0], b.values[0]))
    expect(mid.values[0]).toBeLessThan(Math.max(a.values[0], b.values[0]))
    expect(lookupCritical(data, { n: 16, k: 1, alpha: 0.05 })).toMatchObject({ interpolated: false })
  })
  test('sumbu kategorik tidak diinterpolasi, jangkauan dilaporkan', () => {
    const tukey = getTable('tukey-q')!
    expect(tukey.lookup({ k: '3', df: '20', alpha: '0.03' })).toHaveProperty('error')
    expect(tukey.lookup({ k: '11', df: '20', alpha: '0.05' })).toHaveProperty('error')
    expect(tukey.lookup({ k: '3', df: '61', alpha: '0.05' })).toHaveProperty('error')
    expect(getTable('durbin-watson')!.lookup({ n: '6', k: '5', alpha: '0.05' })).toHaveProperty('error')
    expect(getTable('toleransi')!.lookup({ n: '1', gamma: '0.95', P: '0.99', sisi: '1' })).toHaveProperty('error')
    const out = tukey.lookup({ k: '3', df: '61', alpha: '0.05' })
    expect(out).toMatchObject({ suggestion: { field: 'df', value: 60 } })
  })
  test('grid kritikal memakai selector dan sel kosong sebagai null', () => {
    const tukey = getTable('tukey-q')!.buildGrid({ alpha: '0.01' })
    expect(tukey.columns).toHaveLength(60)
    expect(tukey.rows[0].cells.every(v => typeof v === 'number')).toBe(true)
    const dw = getTable('durbin-watson')!.buildGrid({ alpha: '0.05' })
    expect(dw.rows.find(r => r.key === '6')!.cells[4]).toBeNull()
    expect(getTable('toleransi')!.buildGrid({ gamma: '0.99', sisi: '2' }).rows.length).toBe(49)
  })
})
