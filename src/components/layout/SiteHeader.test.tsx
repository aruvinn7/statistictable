import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

test('menampilkan merek dan tombol pencarian', () => {
  render(
    <MemoryRouter>
      <SiteHeader />
    </MemoryRouter>,
  )
  expect(screen.getByText('Statistictable')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /cari tabel/i })).toBeInTheDocument()
})
