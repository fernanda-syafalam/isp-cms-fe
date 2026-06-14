import { describe, expect, it } from 'vitest'

import { deleteNode, listTopology } from './topology'
import { listSplitters } from './cabling'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the DELETE cascade frees the cabling a customer drop
// holds, so projected capacity stays honest.
function occupiedFor(
  splitters: Awaited<ReturnType<typeof listSplitters>>,
  customerId: string,
): number {
  return splitters.items.reduce(
    (acc, s) => acc + s.ports.filter((p) => p.customerId === customerId).length,
    0,
  )
}

describe('topology DELETE cascade (cabling)', () => {
  it('frees the splitter port when a customer node is deleted', async () => {
    const topo = await listTopology()
    const customer = topo.items.find((n) => n.type === 'customer' && n.meta?.customerId)
    const customerId = customer?.meta?.customerId
    if (!customer || !customerId) throw new Error('seed has no provisioned customer node')

    expect(occupiedFor(await listSplitters(), customerId)).toBe(1)

    await deleteNode(customer.id)

    expect(occupiedFor(await listSplitters(), customerId)).toBe(0)
  })
})
