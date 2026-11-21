import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">404</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Halaman tidak ditemukan</h1>
      <Link to="/" className="mt-6 inline-block text-green underline underline-offset-4">
        Kembali ke beranda
      </Link>
    </div>
  )
}
