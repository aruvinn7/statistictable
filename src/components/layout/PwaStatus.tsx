import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff, X } from 'lucide-react'
import { requestPwaUpdate, usePwaState } from '../../lib/pwa'

export function PwaStatus() {
  const { needRefresh, offlineReady } = usePwaState()
  const [online, setOnline] = useState(() => navigator.onLine)
  const [showReady, setShowReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  useEffect(() => {
    if (!offlineReady) return
    setShowReady(true)
    const timeout = setTimeout(() => setShowReady(false), 6000)
    return () => clearTimeout(timeout)
  }, [offlineReady])
  if (!online) return <div className="pwa-banner" role="status">
    <WifiOff size={15} aria-hidden="true" />
    <span>Anda offline. Tabel yang sudah tersimpan di cache tetap dapat dibuka.</span>
  </div>
  if (needRefresh && !dismissed) return <div className="pwa-banner" role="status">
    <RefreshCw size={15} aria-hidden="true" />
    <span>Versi baru tersedia.</span>
    <button type="button" className="pwa-action" onClick={() => { requestPwaUpdate(); setDismissed(true) }}>Muat ulang</button>
    <button type="button" className="pwa-close" aria-label="Tutup pemberitahuan" onClick={() => setDismissed(true)}><X size={14} /></button>
  </div>
  if (showReady) return <div className="pwa-banner" role="status">
    <span>Situs siap dipakai offline.</span>
    <button type="button" className="pwa-close" aria-label="Tutup pemberitahuan" onClick={() => setShowReady(false)}><X size={14} /></button>
  </div>
  return null
}
