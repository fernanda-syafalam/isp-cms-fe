import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import { TopologySearchBox } from './TopologySearchBox'

const NODES: NetworkNode[] = [
  {
    id: 'odp-1',
    name: 'ODP Mawar',
    type: 'odp',
    status: 'up',
    lat: -6.55,
    lng: 110.68,
    parentId: 'odc-1',
  },
  {
    id: 'olt-1',
    name: 'OLT Pusat',
    type: 'olt',
    status: 'up',
    lat: -6.55,
    lng: 110.68,
    parentId: null,
  },
  {
    id: 'c1-node',
    name: 'Budi Santoso',
    type: 'customer',
    status: 'up',
    lat: -6.55,
    lng: 110.68,
    parentId: 'odp-1',
    meta: { customerId: 'c1', phone: '081298765432', onuSerial: 'ZTEGABCDEF' },
  },
]

// The box is controlled, so a tiny harness owns the query the way the page does.
function Harness({ onPick }: { onPick: (n: NetworkNode) => void }) {
  const [query, setQuery] = useState('')
  return <TopologySearchBox nodes={NODES} query={query} onQueryChange={setQuery} onPick={onPick} />
}

describe('TopologySearchBox', () => {
  it('lists matches as you type and picks one on click', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)

    await user.type(screen.getByPlaceholderText(/cari nama/i), 'mawar')
    await user.click(await screen.findByText('ODP Mawar'))

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'odp-1' }))
  })

  it('finds a customer node by phone and shows why it matched', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)

    await user.type(screen.getByPlaceholderText(/cari nama/i), '081298')
    const result = await screen.findByText('Budi Santoso')
    // the result names the matched field so the tech knows why it surfaced
    expect(screen.getByText('Telepon: 081298765432')).toBeInTheDocument()

    await user.click(result)
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1-node' }))
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Harness onPick={vi.fn()} />)

    await user.type(screen.getByPlaceholderText(/cari nama/i), 'zzz-none')

    expect(await screen.findByText(/tidak ada node/i)).toBeInTheDocument()
  })

  it('renders no result list until the user types', () => {
    render(<Harness onPick={vi.fn()} />)
    expect(screen.queryByText('ODP Mawar')).not.toBeInTheDocument()
  })
})
