import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RouteErrorView } from './route-error'
import { RouteNotFoundView } from './route-not-found'
import { RoutePending } from './route-pending'

describe('RouteErrorView', () => {
  it('announces the failure and offers two recovery paths', () => {
    render(<RouteErrorView onRetry={vi.fn()} onReload={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Terjadi kesalahan')
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Muat ulang halaman' })).toBeInTheDocument()
  })

  it('runs retry and reload handlers on click', async () => {
    const onRetry = vi.fn()
    const onReload = vi.fn()
    render(<RouteErrorView onRetry={onRetry} onReload={onReload} />)

    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    await userEvent.click(screen.getByRole('button', { name: 'Muat ulang halaman' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onReload).toHaveBeenCalledTimes(1)
  })
})

describe('RouteNotFoundView', () => {
  it('points the user back to a role-aware home', () => {
    render(<RouteNotFoundView homeHref="/portal" />)

    expect(screen.getByText('Halaman tidak ditemukan')).toBeInTheDocument()
    const home = screen.getByRole('link', { name: 'Kembali ke beranda' })
    expect(home).toHaveAttribute('href', '/portal')
  })
})

describe('RoutePending', () => {
  it('announces loading to assistive tech', () => {
    render(<RoutePending />)

    const status = screen.getByText('Memuat halaman…')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
