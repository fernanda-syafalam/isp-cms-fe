import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listSplices } from '@/api/cabling'
import { renderWithProviders } from '@/test/helpers'

import { ClosureDetail } from './ClosureDetail'

// Resolve a node whose closure actually has a splice (proves the derivation too).
async function nodeWithSplice(): Promise<string> {
  const splices = (await listSplices()).items
  expect(splices.length).toBeGreaterThan(0)
  return (splices[0]?.closureId ?? '').replace(/-closure$/, '')
}

describe('ClosureDetail', () => {
  it('shows the closure capacity + splices for a selected ODP', async () => {
    renderWithProviders(
      <ClosureDetail nodeId={await nodeWithSplice()} nodeType="odp" canManage={false} />,
    )

    expect(await screen.findByText(/Closure/)).toBeInTheDocument()
    expect(screen.getByText('Kapasitas fiber')).toBeInTheDocument()
    // at least one fusion splice row (feeder → core)
    expect((await screen.findAllByText(/Feeder →/)).length).toBeGreaterThan(0)
  })

  it('renders nothing for a node without a closure when read-only', () => {
    const { container } = renderWithProviders(
      <ClosureDetail nodeId="no-closure-node" nodeType="odp" canManage={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('offers to add a closure for a node without one (manage rights)', () => {
    renderWithProviders(<ClosureDetail nodeId="no-closure-node" nodeType="odp" canManage />)
    expect(screen.getByText('Node ini belum punya closure.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah closure' })).toBeInTheDocument()
  })

  it('hides the splice add/remove controls without manage rights', async () => {
    renderWithProviders(
      <ClosureDetail nodeId={await nodeWithSplice()} nodeType="odp" canManage={false} />,
    )
    await screen.findByText(/Closure/)
    expect(screen.queryByRole('button', { name: 'Tambah' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hapus sambungan' })).not.toBeInTheDocument()
  })

  it('exposes the add + per-splice remove controls with manage rights', async () => {
    renderWithProviders(<ClosureDetail nodeId={await nodeWithSplice()} nodeType="odp" canManage />)
    expect(await screen.findByRole('button', { name: 'Tambah' })).toBeInTheDocument()
    expect(
      (await screen.findAllByRole('button', { name: 'Hapus sambungan' })).length,
    ).toBeGreaterThan(0)
  })
})
