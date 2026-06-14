import { describe, expect, it } from 'vitest'

import { listAudit } from './audit'
import { installCustomerDrop } from './cabling'
import { listCustomers } from './customers'
import { createNode, deleteNode, listTopology } from './topology'

// Integration over the MSW layer: every topology mutation must leave an audit
// entry addressable by the node id, so the change history is complete.
describe('topology edits record an audit trail', () => {
  it('records a node create against its id', async () => {
    const node = await createNode({
      name: 'ODP Audit',
      type: 'odp',
      status: 'up',
      parentId: null,
      lat: -6.55,
      lng: 110.68,
      splitterRatio: '1:8',
    })
    const log = await listAudit({ entityId: node.id })
    expect(log.items).toHaveLength(1)
    expect(log.items[0]?.action).toBe('topology.create')
    expect(log.items[0]?.entityId).toBe(node.id)
  })

  it('records an install and a delete against the customer node id', async () => {
    const candidate = (await listCustomers({ status: 'prospek' })).items[0]
    if (!candidate) throw new Error('seed has no node-less subscriber')
    const odp = (await listTopology()).items.find(
      (n) => n.type === 'odp' && (n.meta?.portsTotal ?? 0) > (n.meta?.portsUsed ?? 0),
    )
    if (!odp) throw new Error('no ODP with a free port')

    const node = await installCustomerDrop({
      customerId: candidate.id,
      odpId: odp.id,
      lat: odp.lat,
      lng: odp.lng,
    })
    let log = await listAudit({ entityId: node.id })
    expect(log.items.some((e) => e.action === 'topology.install')).toBe(true)

    await deleteNode(node.id)
    log = await listAudit({ entityId: node.id })
    expect(log.items.some((e) => e.action === 'topology.delete')).toBe(true)
  })

  it('scopes the filter to the requested node only', async () => {
    const a = await createNode({
      name: 'ODP A',
      type: 'odp',
      status: 'up',
      parentId: null,
      lat: -6.55,
      lng: 110.68,
    })
    const b = await createNode({
      name: 'ODP B',
      type: 'odp',
      status: 'up',
      parentId: null,
      lat: -6.56,
      lng: 110.69,
    })
    const log = await listAudit({ entityId: a.id })
    expect(log.items.every((e) => e.entityId === a.id)).toBe(true)
    expect(log.items.some((e) => e.entityId === b.id)).toBe(false)
  })
})
