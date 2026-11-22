import { useEffect, useRef, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { searchTables } from '../../lib/tables/registry'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [online, setOnline] = useState(() => navigator.onLine)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(v => !v); return }
      const target = e.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  useEffect(() => { if (open) { setQuery(''); dialog.current?.showModal() } else if (dialog.current?.open) { dialog.current.close(); trigger.current?.focus() } }, [open])
  const results = searchTables(query)
  return (<>
    <header className="sticky top-0 z-40 border-b border-hair bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="font-display text-[20px] leading-none tracking-tight text-green"
        >
          Statistictable
        </Link>

        <nav aria-label="Navigasi utama" className="ml-2 flex items-center gap-4 sm:ml-5 sm:gap-5">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Beranda</NavLink>
          <NavLink to="/tentang" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Tentang</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {!online && <span className="offline-badge"><WifiOff size={12} aria-hidden="true" /> <span className="offline-label">Offline</span></span>}
          <button
            ref={trigger}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Cari tabel"
            className="search-trigger flex items-center gap-2 rounded-md border border-hair bg-white px-3 py-1.5 text-[12.5px] text-subtle transition-colors hover:border-hair-strong hover:text-ink"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">Cari tabel…</span>
            <kbd className="ml-1 hidden rounded border border-hair px-1 font-sans text-[10px] text-subtle sm:inline">
              Ctrl K
            </kbd>
          </button>

        </div>
      </div>
    </header>
    <dialog ref={dialog} className="command-dialog" onCancel={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) setOpen(false) }} aria-label="Pencarian tabel">
      <div className="command-top"><strong>Cari referensi</strong><button type="button" onClick={() => setOpen(false)} aria-label="Tutup pencarian">Esc ×</button></div>
      <form onSubmit={e => { e.preventDefault(); if (results[0]) { navigate(`/t/${results[0].id}`); setOpen(false) } }}><input autoFocus aria-label="Cari nama atau simbol tabel" placeholder="Cari tabel: nama, simbol, atau alias…" value={query} onChange={e => setQuery(e.target.value)} /></form>
      <nav aria-label="Hasil pencarian">{results.map(t => <Link key={t.id} to={`/t/${t.id}`} onClick={() => setOpen(false)}><span className="font-display text-2xl text-green">{t.symbol}</span><span>{t.name}<small>{t.group}</small></span><span aria-hidden="true">↗</span></Link>)}{!results.length && <p className="empty">Tidak ada tabel yang cocok.</p>}</nav>
    </dialog>
    </>
  )
}
