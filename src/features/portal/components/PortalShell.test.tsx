import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PortalShell } from './PortalShell'

// PortalShell's own structure is what we test — stub the router Link and the
// auth UserMenu so the shell renders without a full router/query/auth stack.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/auth', () => ({
  UserMenu: () => <button type="button">Menu pengguna</button>,
}))

describe('PortalShell', () => {
  it('renders children inside a focusable main#main-content', () => {
    render(
      <PortalShell>
        <p>Konten portal</p>
      </PortalShell>,
    )
    const main = screen.getByText('Konten portal').closest('main')
    expect(main).not.toBeNull()
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('exposes the skip link to the main content', () => {
    render(
      <PortalShell>
        <div />
      </PortalShell>,
    )
    const skip = screen.getByText('Lewati ke konten utama')
    expect(skip).toHaveAttribute('href', '#main-content')
  })

  it('renders the brand home link and user menu but none of the ops chrome', () => {
    render(
      <PortalShell>
        <div />
      </PortalShell>,
    )
    expect(screen.getByRole('link', { name: 'Beranda' })).toHaveAttribute('href', '/portal')
    expect(screen.getByRole('button', { name: 'Menu pengguna' })).toBeInTheDocument()
    // Ops-only chrome must be absent in the slim shell.
    expect(screen.queryByRole('button', { name: 'Notifikasi' })).toBeNull()
    expect(screen.queryByPlaceholderText(/cari/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /sidebar/i })).toBeNull()
  })
})
