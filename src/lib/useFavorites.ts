import { useCallback, useState } from 'react'

const KEY = 'st.favorites'

function read(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : []
  } catch { return [] }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(read)
  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(v => v !== id) : [id, ...prev]
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* Private storage may be unavailable. */ }
      return next
    })
  }, [])
  return { favorites: ids, isFavorite: (id: string) => ids.includes(id), toggle }
}
