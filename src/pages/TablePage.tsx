import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Copy, Download, Printer, ArrowLeft, Star, Calculator } from 'lucide-react'
import { getTable } from '../lib/tables/registry'
import { formatNumber, formatProbability, formatValue, toCsv } from '../lib/format'
import { TableGrid } from '../components/table/TableGrid'
import { SelectMenu } from '../components/ui/SelectMenu'
import { useFavorites } from '../lib/useFavorites'
import { NotFound } from './NotFound'
import type { LookupField, TableDef } from '../lib/tables/types'

export function TablePage() {
  const { id = '' } = useParams()
  const table = getTable(id)
  return table ? <TableContent key={id} table={table} /> : <NotFound />
}

function TableContent({ table }: { table: TableDef }) {
  const [params, setParams] = useSearchParams()
  const mode: 'critical' | 'pvalue' = params.get('mode') === 'p' && table.pvalue ? 'pvalue' : 'critical'
  const activeFields: LookupField[] = mode === 'pvalue' ? table.pvalue!.fields : table.fields
  const initial = Object.fromEntries(activeFields.map(f => [f.key, params.get(f.key) ?? f.default]))
  const [values, setValues] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const [notice, setNotice] = useState('')
  const [digits, setDigits] = useState(() => {
    const saved = Number(localStorage.getItem('st.digits'))
    return saved === 3 || saved === 4 || saved === 6 ? saved : 3
  })
  const [scientific, setScientific] = useState(() => localStorage.getItem('st.scientific') === '1')
  const { isFavorite, toggle } = useFavorites()

  useEffect(() => {
    const nextMode = params.get('mode') === 'p' && table.pvalue ? 'pvalue' : 'critical'
    const fields = nextMode === 'pvalue' ? table.pvalue!.fields : table.fields
    const next = Object.fromEntries(fields.map(f => [f.key, params.get(f.key) ?? f.default]))
    setValues(next); setSubmitted(next)
  }, [params, table])
  useEffect(() => {
    try { const raw: unknown = JSON.parse(localStorage.getItem('st.recent') ?? '[]'); const ids = Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : []; localStorage.setItem('st.recent', JSON.stringify([table.id, ...ids.filter(id => id !== table.id)].slice(0, 5))) } catch { /* Private storage may be unavailable. */ }
  }, [table.id])
  useEffect(() => {
    try { localStorage.setItem('st.digits', String(digits)); localStorage.setItem('st.scientific', scientific ? '1' : '0') } catch { /* Private storage may be unavailable. */ }
  }, [digits, scientific])
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timeout) }, [notice])

  const outcome = useMemo(
    () => mode === 'pvalue' ? table.pvalue!.lookup(submitted) : table.lookup(submitted),
    [table, submitted, mode],
  )
  const controls = useMemo(
    () => Object.fromEntries(table.gridSelectors.map(f => [f.key, params.get(f.key) ?? submitted[f.key] ?? f.default])),
    [table.gridSelectors, params, submitted],
  )
  const grid = useMemo(() => table.buildGrid(controls), [table, controls])
  const probabilityResult = mode === 'pvalue' || ('kind' in outcome && outcome.kind === 'probability')
  const formatResult = (value: number) => probabilityResult
    ? formatProbability(value, Math.max(4, digits), scientific)
    : formatNumber(value, digits, scientific)
  const highlight = mode === 'pvalue' || probabilityResult || table.id === 'z' ? undefined : submitted[grid.rowHeader]

  function submit(next: Record<string, string>, nextMode: 'critical' | 'pvalue' = mode) {
    const fields = nextMode === 'pvalue' ? table.pvalue!.fields : table.fields
    const allowed = new Set([...fields.map(f => f.key), ...table.gridSelectors.map(f => f.key)])
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(next)) {
      if (allowed.has(key)) search.set(key, value)
    }
    for (const field of table.gridSelectors) {
      if (!(field.key in next)) search.set(field.key, controls[field.key] ?? field.default)
    }
    if (nextMode === 'pvalue') search.set('mode', 'p')
    setSubmitted(next)
    setParams(search)
  }
  function switchMode(nextMode: 'critical' | 'pvalue') {
    if (nextMode === mode) return
    const fields = nextMode === 'pvalue' ? table.pvalue!.fields : table.fields
    const next = Object.fromEntries(fields.map(f => [f.key, f.default]))
    for (const f of table.gridSelectors) next[f.key] = controls[f.key]
    setValues(next)
    submit(next, nextMode)
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice('Tersalin ke clipboard.') } catch { setNotice('Clipboard tidak tersedia. Gunakan Unduh CSV atau pilih teks secara manual.') }
  }
  function citation() {
    if ('error' in outcome) return ''
    const parts = activeFields.map(f => `${f.key}=${submitted[f.key] ?? f.default}`)
    const value = formatValue(outcome.primary.value, Math.max(3, digits), scientific)
    return [
      table.name,
      `${table.symbol}(${parts.join(', ')})${mode === 'pvalue' ? ' → p =' : ' ='} ${value}`,
      'Sumber: Statistictable',
    ].join('\n')
  }
  function download() {
    const blob = new Blob(['\uFEFF' + toCsv(grid)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `tabel-${table.id}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const favorite = isFavorite(table.id)

  return <article>
    <Link className="back-link" to="/"><ArrowLeft size={14} /> Semua tabel</Link>
    <div className="table-heading">
      <div>
        <p className="eyebrow">{table.group} / {table.symbol}</p>
        <h1>{table.name}</h1>
        <p>{table.subtitle}</p>
      </div>
      <button
        type="button"
        className="favorite-button"
        aria-pressed={favorite}
        onClick={() => { toggle(table.id); setNotice(favorite ? 'Dihapus dari favorit.' : 'Disimpan ke favorit.') }}
      >
        <Star size={15} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Favorit' : 'Simpan'}
      </button>
    </div>
    <section className="lookup-panel" aria-label="Cari nilai" data-print="hide">
      {table.status === 'tersedia' && <form onSubmit={e => { e.preventDefault(); submit(values) }} className="lookup-form">
        <div className="lookup-heading">
          <p className="eyebrow">{mode === 'pvalue' ? 'CARI P-VALUE' : 'CARI NILAI'}</p>
          <Link className="glossary-link" to="/tentang#glosarium">Glosarium ↗</Link>
        </div>
        <p className="lookup-intro">{mode === 'pvalue' ? 'Masukkan statistik uji dan derajat kebebasan untuk menghitung peluang.' : 'Masukkan parameter tabel, lalu bandingkan hasilnya dengan statistik uji Anda.'}</p>
        {table.pvalue && <div className="mode-switch" role="group" aria-label="Jenis hasil">
          <button type="button" aria-pressed={mode === 'critical'} onClick={() => switchMode('critical')}>Nilai kritis</button>
          <button type="button" aria-pressed={mode === 'pvalue'} onClick={() => switchMode('pvalue')}>p-value</button>
        </div>}
        <div className="lookup-fields">{activeFields.map(f => f.kind === 'select'
          ? <div className="lookup-field" key={f.key}>
            <span>{f.label}</span>
            <SelectMenu label={f.label} value={values[f.key] ?? f.default} options={f.options ?? []} onChange={value => setValues({ ...values, [f.key]: value })} />
          </div>
          : <label key={f.key}>
            <span>{f.label}</span>
            <input aria-label={f.label} type="text" inputMode="decimal" autoComplete="off" value={values[f.key] ?? f.default} onChange={e => setValues({ ...values, [f.key]: e.target.value })} />
          </label>)}</div>
        <button className="primary-button" type="submit"><Calculator size={15} aria-hidden="true" />{mode === 'pvalue' ? 'Hitung p-value' : 'Hitung nilai'}</button>
        <p className="form-hint">Tekan Enter untuk menghitung. Nilai di luar jangkauan tabel tidak diberi angka.</p>
        {!table.pvalue && table.id !== 'binomial' && table.id !== 'poisson' && <p className="form-hint form-hint-note">Tabel ini tidak menyediakan mode p-value; gunakan nilai kritis pada α yang dipilih.</p>}
      </form>}
      <div className="result-display" data-testid="result" aria-live="polite" aria-atomic="true">
        <p className="eyebrow result-eyebrow">HASIL</p>
        {'error' in outcome ? <div role="alert" className="error-message">
          <p>{outcome.error}</p>
          {outcome.suggestion && <button type="button" className="text-button" onClick={() => {
            const next = { ...values, [outcome.suggestion!.field]: String(outcome.suggestion!.value) }
            setValues(next); submit(next)
          }}>Isi {outcome.suggestion.label} = {outcome.suggestion.value}</button>}
        </div> : <>
          <div className="result-values">{[outcome.primary, ...(outcome.secondary ? [outcome.secondary] : [])].map(v => <div key={v.label}><span className="eyebrow">{v.label}</span><strong>{outcome.interpolated ? '≈ ' : ''}{formatResult(v.value)}</strong></div>)}</div>
          <p className="result-context">{activeFields.filter(f => f.key !== 'mode').map(f => `${f.label}: ${submitted[f.key] === '2' && f.key === 'tails' ? 'dua ekor (two-tailed)' : submitted[f.key] === '1' && f.key === 'tails' ? 'satu ekor (one-tailed)' : submitted[f.key]}`).join(' · ')}</p>
          {outcome.note && <p className="result-note">{outcome.note}</p>}
          {outcome.interpolated && <p className="result-note">≈ interpolasi antar nilai tabel</p>}
          <div className="result-actions">
            <button className="text-button" type="button" onClick={() => copy(citation())}><Copy size={13} /> Salin kutipan</button>
            <button className="text-button" type="button" onClick={() => copy([table.name, ...[outcome.primary, ...(outcome.secondary ? [outcome.secondary] : [])].map(v => `${v.label}: ${v.value}`), ...Object.entries(submitted).map(([k, v]) => `${k}=${v}`)].join('\n'))}><Copy size={13} /> Salin hasil</button>
          </div>
        </>}
      </div>
    </section>
    <details className="guide"><summary>Panduan membaca tabel <span>+</span></summary><div>{table.guide.map((p, i) => <p key={i}>{p}</p>)}</div></details>
    {table.status === 'tersedia' && <section className="grid-section">
      <div className="grid-toolbar">
        <h2>Referensi lengkap</h2>
        <div className="grid-controls" data-print="hide">
          {table.gridSelectors.map(f => <div className="grid-field" key={f.key}>
            <span>{f.label}</span>
            <SelectMenu variant="compact" label={`Grid ${f.label}`} value={controls[f.key]} options={f.options} onChange={value => submit({ ...submitted, [f.key]: value })} />
          </div>)}
          <div className="grid-field">
            <span>Desimal</span>
            <SelectMenu variant="compact" label="Jumlah desimal" value={String(digits)} options={[{ value: '3', label: '3' }, { value: '4', label: '4' }, { value: '6', label: '6' }]} onChange={value => setDigits(Number(value))} />
          </div>
          <label className="check-label"><input type="checkbox" checked={scientific} onChange={e => setScientific(e.target.checked)} /> ×10ⁿ</label>
        </div>
      </div>
      <p className="grid-help" data-print="hide">Klik angka untuk menyalin dan menandai baris/kolom. Tombol panah berpindah sel, Enter menyalin, Escape melepas penanda. — = tidak ada nilai.</p>
      <TableGrid model={grid} highlightRow={highlight} probability={probabilityResult || table.id === 'z'} digits={digits} scientific={scientific} onCellClick={copy} />
      <div className="table-actions" data-print="hide"><button onClick={() => { const row = grid.rows.find(r => r.key === highlight); copy(row ? [row.label, ...row.cells.map(v => v ?? '—')].join('\t') : toCsv(grid)) }}><Copy size={15} />{highlight ? 'Salin baris' : 'Salin tabel'}</button><button onClick={download}><Download size={15} />Unduh CSV</button><button onClick={() => window.print()}><Printer size={15} />Cetak / PDF</button></div>
    </section>}
    <section className="method-note"><h2>Metode & sumber</h2><p>{table.method}</p>{mode === 'pvalue' && <p className="result-note">p-value dihitung dari statistik uji yang Anda masukkan, bukan dibaca dari grid nilai kritis.</p>}<Link to="/tentang">Baca tentang akurasi dan batasan ↗</Link></section>
    <div className="toast" role="status" data-print="hide">{notice}</div>
  </article>
}
