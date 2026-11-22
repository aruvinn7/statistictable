import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { TableGrid } from './TableGrid'
import { getTable } from '../../lib/tables/registry'

test('pivot menyorot nilai, baris, kolom, dan header', () => {
  const model = getTable('t')!.buildGrid({ alpha: '0.05' })
  render(<TableGrid model={model} />)
  const cell = screen.getAllByRole('button', { name: /2\.042/ })[0]
  fireEvent.pointerEnter(cell)
  const td = cell.closest('td')!
  expect(td).toHaveClass('pivot-cell')
  expect(td.parentElement!.querySelectorAll('td.pivot-line').length).toBeGreaterThan(0)
  expect(document.querySelectorAll('th.pivot-header').length).toBeGreaterThanOrEqual(2)
  fireEvent.pointerLeave(screen.getByRole('region', { name: /Grid tabel statistik/ }))
  expect(document.querySelector('.pivot-cell')).toBeNull()
})

test('klik menandai sel, panah berpindah, Escape melepas', () => {
  const model = getTable('t')!.buildGrid({ alpha: '0.05' })
  render(<TableGrid model={model} />)
  const region = screen.getByRole('region', { name: /Grid tabel statistik/ })
  fireEvent.keyDown(region, { key: 'ArrowDown' })
  expect(document.querySelector('.pivot-cell')).not.toBeNull()
  fireEvent.pointerLeave(region)
  expect(document.querySelector('.pivot-cell')).not.toBeNull()
  fireEvent.keyDown(region, { key: 'Escape' })
  expect(document.querySelector('.pivot-cell')).toBeNull()
})

test('tabel z memuat nilai negatif sampai positif', () => {
  const model = getTable('z')!.buildGrid({})
  expect(model.rows).toHaveLength(61)
  expect(model.rows[0].label).toBe('-3.0')
  expect(model.rows.at(-1)!.label).toBe('3.0')
  const row = model.rows.find(r => r.key === '-2.0')!
  expect(row.cells[4]).toBeCloseTo(0.025, 3)
})
