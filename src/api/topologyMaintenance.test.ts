import { describe, expect, it } from 'vitest'

import { listAudit } from './audit'
import { createNode, listTopology, updateNode } from './topology'

// Integration over the MSW layer: the maintenance directive persists on the node
// meta and leaves a dedicated audit entry, so planned work is recorded.
describe('topology maintenance toggle', () => {
  it('sets and clears meta.maintenance and audits each change', async () => {
    const node = await createNode({
      name: 'ODP Maint',
      type: 'odp',
      status: 'up',
      parentId: null,
      lat: -6.55,
      lng: 110.68,
    })

    await updateNode(node.id, { maintenance: true })
    let after = (await listTopology()).items.find((n) => n.id === node.id)
    expect(after?.meta?.maintenance).toBe(true)

    await updateNode(node.id, { maintenance: false })
    after = (await listTopology()).items.find((n) => n.id === node.id)
    expect(after?.meta?.maintenance).toBe(false)

    const log = await listAudit({ entityId: node.id })
    expect(log.items.some((e) => e.action === 'topology.maintenance')).toBe(true)
  })
})
