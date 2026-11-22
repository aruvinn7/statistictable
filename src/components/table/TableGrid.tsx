import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatNumber, formatProbability } from '../../lib/format'
import type { GridModel } from '../../lib/tables/types'

interface Pivot { row: number; col: number }

export function TableGrid({ model, highlightRow, probability, digits = 3, scientific = false, onCellClick }: {
  model: GridModel
  highlightRow?: string
  probability?: boolean
  digits?: number
  scientific?: boolean
  onCellClick?: (value: string) => void
}) {
  const selected = useRef<HTMLTableRowElement>(null)
  const cellRefs = useRef(new Map<string, HTMLButtonElement>())
  const [hover, setHover] = useState<Pivot | null>(null)
  const [pinned, setPinned] = useState<Pivot | null>(null)
  const pivot = pinned ?? hover
  useEffect(() => { selected.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }, [highlightRow])
  useEffect(() => { setHover(null); setPinned(null) }, [model])
  const valueAt = (p: Pivot) => model.rows[p.row]?.cells[p.col]
  function focusCell(next: Pivot) {
    setPinned(next)
    setHover(null)
    requestAnimationFrame(() => cellRefs.current.get(`${next.row}:${next.col}`)?.focus())
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!model.rows.length || !model.columns.length) return
    const base = pivot ?? { row: 0, col: 0 }
    const move = (row: number, col: number) => {
      event.preventDefault()
      focusCell({
        row: Math.max(0, Math.min(model.rows.length - 1, row)),
        col: Math.max(0, Math.min(model.columns.length - 1, col)),
      })
    }
    switch (event.key) {
      case 'ArrowUp': return move(base.row - 1, base.col)
      case 'ArrowDown': return move(base.row + 1, base.col)
      case 'ArrowLeft': return move(base.row, base.col - 1)
      case 'ArrowRight': return move(base.row, base.col + 1)
      case 'Home': return move(base.row, 0)
      case 'End': return move(base.row, model.columns.length - 1)
      case 'Escape': setPinned(null); setHover(null); return
      case 'Enter': {
        const value = pinned ? valueAt(pinned) : null
        if (value !== null && value !== undefined) { event.preventDefault(); onCellClick?.(String(value)) }
        return
      }
    }
  }
  return <div
    className="grid-scroll overflow-auto"
    tabIndex={0}
    role="region"
    aria-label="Grid tabel statistik. Gunakan tombol panah untuk berpindah sel, Enter untuk menyalin, Escape untuk melepas penanda."
    onKeyDown={onKeyDown}
    onPointerLeave={() => setHover(null)}
  >
    <table className={`stats-grid tabular-nums ${model.columns.length > 10 ? 'table-wide' : ''}`}>
      <caption>{model.caption}</caption>
      <thead><tr>
        <th scope="col" className={pivot ? 'pivot-header' : undefined}>{model.rowHeader}</th>
        {model.columns.map((c, i) => <th scope="col" key={c.key} className={pivot?.col === i ? 'pivot-header' : undefined}>{c.label}</th>)}
      </tr></thead>
      <tbody>{model.rows.map((row, rowIndex) => {
        const rowActive = pivot?.row === rowIndex
        return <tr key={row.key} ref={row.key === highlightRow ? selected : undefined} data-highlighted={row.key === highlightRow}>
          <th scope="row" className={rowActive ? 'pivot-header' : undefined}>{row.label}</th>
          {row.cells.map((v, colIndex) => {
            const cell = pivot?.row === rowIndex && pivot.col === colIndex
            const inRow = pivot?.row === rowIndex
            const inCol = pivot?.col === colIndex
            return <td
              key={colIndex}
              className={cell ? 'pivot-cell' : inRow || inCol ? 'pivot-line' : undefined}
              onPointerEnter={() => setHover({ row: rowIndex, col: colIndex })}
            >
              {v === null
                ? <span title="Tidak ada nilai untuk parameter ini">—</span>
                : <button
                  ref={el => {
                    const key = `${rowIndex}:${colIndex}`
                    if (el) cellRefs.current.set(key, el)
                    else cellRefs.current.delete(key)
                  }}
                  type="button"
                  title="Salin nilai dan tandai baris/kolom"
                  aria-label={`Salin ${row.label}, ${model.columns[colIndex].label}: ${v}`}
                  onFocus={() => setPinned({ row: rowIndex, col: colIndex })}
                  onClick={() => { setPinned(prev => prev?.row === rowIndex && prev.col === colIndex ? null : { row: rowIndex, col: colIndex }); onCellClick?.(String(v)) }}
                >{probability ? formatProbability(v, digits, scientific) : formatNumber(v, digits, scientific)}</button>}
            </td>
          })}
        </tr>
      })}</tbody>
    </table>
  </div>
}
