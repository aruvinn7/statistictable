import { Link } from 'react-router-dom'
export function NotFound() {
  return <section className="prose-page"><p className="eyebrow">404</p><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak dikenali. Kembali ke daftar tabel untuk mencari referensi.</p><Link className="back-link" to="/">← Kembali ke beranda</Link></section>
}
