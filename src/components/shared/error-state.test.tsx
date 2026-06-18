import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { ErrorState } from './error-state'

describe('ErrorState', () => {
  it('announces itself to assistive tech and shows a default title', () => {
    renderWithProviders(<ErrorState />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Gagal memuat data')
  })

  it('renders a custom title and description', () => {
    renderWithProviders(
      <ErrorState title="Gagal memuat tagihan" description="Periksa koneksi lalu coba lagi." />,
    )

    expect(screen.getByText('Gagal memuat tagihan')).toBeInTheDocument()
    expect(screen.getByText('Periksa koneksi lalu coba lagi.')).toBeInTheDocument()
  })

  it('shows no retry button when onRetry is omitted', () => {
    renderWithProviders(<ErrorState />)

    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn()
    renderWithProviders(<ErrorState onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
