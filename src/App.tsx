import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteHeader } from './components/layout/SiteHeader'
import { Home } from './pages/Home'
import { TablePage } from './pages/TablePage'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <BrowserRouter>
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
      </div>
    </BrowserRouter>
  )
}
