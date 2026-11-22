import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SiteHeader } from './components/layout/SiteHeader'
import { Home } from './pages/Home'
import { TablePage } from './pages/TablePage'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'
import { PwaStatus } from './components/layout/PwaStatus'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) { target.scrollIntoView({ block: 'start' }); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <div className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 pb-24 pt-8 sm:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/t/:id" element={<TablePage />} />
            <Route path="/tentang" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <PwaStatus />
      </div>
    </BrowserRouter>
  )
}
