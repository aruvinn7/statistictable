import { Link } from 'react-router-dom'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="font-display text-[20px] leading-none tracking-tight text-green"
        >
          Statistictable
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Cari tabel"
            className="flex items-center gap-2 rounded-md border border-hair bg-white px-3 py-1.5 text-[12.5px] text-subtle transition-colors hover:border-hair-strong hover:text-ink"
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

          <Link
            to="/tentang"
            className="text-[12.5px] text-subtle transition-colors hover:text-green"
          >
            Tentang
          </Link>
        </div>
      </div>
    </header>
  )
}
