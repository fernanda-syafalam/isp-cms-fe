import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders the title and optional description', () => {
    renderWithProviders(
      <EmptyState title="Belum ada pelanggan" description="Tambahkan pelanggan pertama Anda." />,
    )

    expect(screen.getByText('Belum ada pelanggan')).toBeInTheDocument()
    expect(screen.getByText('Tambahkan pelanggan pertama Anda.')).toBeInTheDocument()
  })

  it('omits the description node when none is given', () => {
    renderWithProviders(<EmptyState title="Belum ada data" />)

    expect(screen.getByText('Belum ada data')).toBeInTheDocument()
    expect(screen.queryByText('Tambahkan pelanggan pertama Anda.')).not.toBeInTheDocument()
  })

  it('renders an action when provided', () => {
    renderWithProviders(
      <EmptyState title="Belum ada data" action={<button type="button">Tambah</button>} />,
    )

    expect(screen.getByRole('button', { name: 'Tambah' })).toBeInTheDocument()
  })
})
