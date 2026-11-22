import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Search, Star, X } from 'lucide-react'
import { useFavorites } from '../lib/useFavorites'
import { getTable, searchTables } from '../lib/tables/registry'

const QUICK_IDS = ['z', 't', 'f', 'chi-square']

export function Home() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Semua')
  const navigate = useNavigate()
  const { favorites } = useFavorites()
  const results = searchTables(query, 26).filter(t => group === 'Semua' || t.group === group.toLowerCase())
  let recent: string[] = []
  try { const stored: unknown = JSON.parse(localStorage.getItem('st.recent') ?? '[]'); if (Array.isArray(stored)) recent = stored.filter((v): v is string => typeof v === 'string').slice(0, 5) } catch { /* Storage may be disabled. */ }
  const quick = QUICK_IDS.map(id => getTable(id)).filter(t => t !== undefined)

  function search(event: React.FormEvent) {
    event.preventDefault()
    if (query.trim() && results[0]) navigate(`/t/${results[0].id}`)
  }

  return <>
    <section className={`hero${!query && group === 'Semua' ? '' : ' hero-searching'}`}>
      <div className="hero-copy">
        <p className="eyebrow">TABEL STATISTIK</p>
        <h1>Tabel statistik parametrik<br /><em>dan nonparametrik.</em></h1>
        <ul className="hero-badges" aria-label="Ringkasan isi">
          <li>26 tabel</li>
          <li>Nilai kritis dan peluang</li>
          <li>Cetak dan CSV</li>
          <li>Tanpa login</li>
        </ul>
        <form className="home-search" onSubmit={search}>
          <Search size={21} aria-hidden="true" />
          <input
            aria-label="Cari tabel statistik"
            placeholder="Cari tabel: t, Mann-Whitney, chi kuadrat…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setQuery('') }}
          />
          {query && <button type="button" className="search-clear" aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={16} /></button>}
          <span className="search-hint">{query ? 'ENTER ↵' : '/ ATAU CTRL K'}</span>
        </form>
      </div>
      {!query && group === 'Semua' && <aside className="hero-quick" aria-label="Tabel yang sering dipakai">
        <div className="quick-head">
          <p className="eyebrow">SERING DIPAKAI</p>
          <span className="quick-count">4 tabel</span>
        </div>
        <div className="quick-list">
          {quick.map(t => <Link key={t.id} to={`/t/${t.id}`} className="quick-item">
            <span className="quick-symbol">{t.symbol}</span>
            <span className="quick-copy"><strong>{t.name.split(' — ')[1] ?? t.name}</strong><span>{t.group}</span></span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>)}
        </div>
        <Link className="quick-all" to="#daftar">Lihat seluruh katalog <ArrowDown size={14} aria-hidden="true" /></Link>
      </aside>}
    </section>

    {favorites.length > 0 && !query && <section className="recent favorites" aria-label="Tabel favorit">
      <span className="eyebrow"><Star size={11} aria-hidden="true" /> FAVORIT</span>
      {favorites.map(id => { const t = getTable(id); return t ? <Link key={id} to={`/t/${id}`}>{t.symbol} <span>{t.name.split(' — ')[1]}</span></Link> : null })}
    </section>}
    {recent.length > 0 && !query && <section className="recent" aria-label="Terakhir dibuka">
      <span className="eyebrow">TERAKHIR DIBUKA</span>
      {recent.map(id => { const t = getTable(id); return t ? <Link key={id} to={`/t/${id}`}>{t.symbol} <span>{t.name.split(' — ')[1]}</span></Link> : null })}
    </section>}

    <section id="daftar" className="catalogue" aria-label="Daftar tabel">
      <div className="catalogue-head">
        <div>
          <p className="eyebrow">KATALOG</p>
          <h2>{query ? 'Hasil pencarian' : 'Semua tabel'}</h2>
          <p>{query ? `Menampilkan hasil untuk “${query}”.` : 'Pilih tabel untuk mencari nilai kritis, peluang, atau p-value.'}</p>
        </div>
        <span className="catalogue-count"><strong>{results.length}</strong> tabel</span>
      </div>
      <div className="catalogue-bar">
        <div role="tablist" aria-label="Kategori tabel">
          {['Semua', 'Parametrik', 'Nonparametrik'].map(g => <button key={g} role="tab" aria-selected={group === g} onClick={() => setGroup(g)}>{g}</button>)}
        </div>
      </div>
      <div className="table-grid-list">{results.map((t, i) => <Link key={t.id} to={`/t/${t.id}`} className="table-card">
        <span className="card-symbol">{t.symbol}</span>
        <span className="card-body">
          <span className="card-kicker">{String(i + 1).padStart(2, '0')} · {t.status === 'tersedia' ? t.group : 'Menunggu sumber'}</span>
          <strong>{t.name}</strong>
          <span className="card-sub">{t.subtitle}</span>
        </span>
        <ArrowUpRight className="card-arrow" size={17} aria-hidden="true" />
      </Link>)}</div>
      {!results.length && <div className="empty-state">
        <p>Tidak ada tabel yang cocok. Coba nama, simbol, atau istilah lain.</p>
        <button type="button" onClick={() => { setQuery(''); setGroup('Semua') }}>Tampilkan semua tabel</button>
      </div>}
    </section>

    <aside className="home-note">
      <span className="eyebrow">METODE</span>
      <p>Nilai dihitung dari fungsi distribusi atau dari definisi numeriknya, lalu dicocokkan dengan nilai tabel terbit. Tujuh tabel tanpa bentuk tertutup memakai perhitungan numerik. Rincian metode dan sumber ada di <Link to="/tentang">halaman Tentang</Link>.</p>
    </aside>
  </>
}
