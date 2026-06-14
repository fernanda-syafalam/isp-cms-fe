import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listSplices } from '@/api/cabling'
import { renderWithProviders } from '@/test/helpers'

import { ClosureDetail } from './ClosureDetail'

describe('ClosureDetail', () => {
  it('shows the closure capacity + splices for a selected ODP', async () => {
    // Pick a closure that actually has a splice (proves the derivation too).
    const splices = (await listSplices()).items
    expect(splices.length).toBeGreaterThan(0)
    const nodeId = (splices[0]?.closureId ?? '').replace(/-closure$/, '')

    renderWithProviders(<ClosureDetail nodeId={nodeId} />)

    expect(await screen.findByText(/Closure/)).toBeInTheDocument()
    expect(screen.getByText('Kapasitas fiber')).toBeInTheDocument()
    // at least one fusion splice row (feeder → core)
    expect((await screen.findAllByText(/Feeder →/)).length).toBeGreaterThan(0)
  })

  it('renders nothing for a node without a closure (e.g. a customer)', () => {
    const { container } = renderWithProviders(<ClosureDetail nodeId="no-closure-node" />)
    expect(container).toBeEmptyDOMElement()
  })
})
