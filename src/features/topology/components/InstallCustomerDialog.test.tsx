import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { listSplitters } from '@/api/cabling'
import { listTopology } from '@/api/topology'
import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { InstallCustomerDialog } from './InstallCustomerDialog'

describe('InstallCustomerDialog', () => {
  it('shows the subscriber picker once customers load', async () => {
    const { items: nodes } = await listTopology()

    renderWithProviders(
      <InstallCustomerDialog open onOpenChange={vi.fn()} nodes={nodes} onInstalled={vi.fn()} />,
    )

    expect(await screen.findByPlaceholderText('Cari pelanggan…')).toBeInTheDocument()
  })

  it('surfaces a friendly error when the customer list fails to load', async () => {
    const { items: nodes } = await listTopology()
    server.use(
      http.get('*/api/customers', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    renderWithProviders(
      <InstallCustomerDialog open onOpenChange={vi.fn()} nodes={nodes} onInstalled={vi.fn()} />,
    )

    expect(await screen.findByText('Gagal memuat daftar pelanggan. Coba lagi.')).toBeInTheDocument()
  })

  it('auto-targets the ODP at the placed pin and previews a zero-length drop', async () => {
    // The placement bug this fixes: the dialog never received a real location,
    // so the drop was measured from a fallback node. Drop the pin exactly on a
    // free ODP and the preview must measure the drop from THAT point (≈ 0 m),
    // proving the passed `latLng` flows into ODP selection + drop measurement.
    const [{ items: nodes }, splitters] = await Promise.all([listTopology(), listSplitters()])
    // An ODP (not an ODC stage) whose splitter still has a customer port free,
    // so nearestFreeOdp + the port preview both resolve to this exact node.
    const odp = nodes.find(
      (n) =>
        n.type === 'odp' &&
        splitters.items.some((s) => s.nodeId === n.id && s.ports.some((p) => p.outNodeId === null)),
    )
    if (!odp) throw new Error('seed has no ODP with a free splitter port')

    renderWithProviders(
      <InstallCustomerDialog
        open
        onOpenChange={vi.fn()}
        nodes={nodes}
        latLng={{ lat: odp.lat, lng: odp.lng }}
        onInstalled={vi.fn()}
      />,
    )

    expect(await screen.findByText(/drop ≈ 0\s*m/)).toBeInTheDocument()
  })
})
