import { describe, expect, it } from 'vitest'

import { listCustomers } from './customers'
import { convertLead, listLeads } from './leads'
import { completeWorkOrder, listWorkOrders } from './workorders'

// Lead-convert → install work-order linkage, end-to-end over the MSW layer
// (server from test/setup.ts; resetMockDb runs before each test). Mirrors the
// real BE, which sets `customerId` on convert and resolves the subscriber by id
// on completion — never by name (two customers can share a name).

async function firstLead(): Promise<{ id: string; name: string }> {
  const { items } = await listLeads()
  const lead = items.find((l) => l.stage !== 'won')
  if (!lead) throw new Error('seed has no convertible lead')
  return { id: lead.id, name: lead.name }
}

describe('lead convert → install work order', () => {
  it('links the install WO to the new customer id (never null)', async () => {
    const lead = await firstLead()
    await convertLead(lead.id)

    const { items: customers } = await listCustomers()
    const created = customers.find((c) => c.fullName === lead.name)
    expect(created).toBeTruthy()

    const { items: workOrders } = await listWorkOrders({ type: 'install' })
    const wo = workOrders.find((w) => w.customerName === lead.name)
    expect(wo).toBeTruthy()
    expect(wo?.customerId).not.toBeNull()
    expect(wo?.customerId).toBe(created?.id)
  })

  it('activates the customer resolved by id when the install WO completes', async () => {
    const lead = await firstLead()
    await convertLead(lead.id)

    const { items: customers } = await listCustomers()
    const created = customers.find((c) => c.fullName === lead.name)
    if (!created) throw new Error('convert did not create the customer')
    expect(created.status).not.toBe('aktif')

    const { items: workOrders } = await listWorkOrders({ type: 'install' })
    const wo = workOrders.find((w) => w.customerId === created.id)
    if (!wo) throw new Error('convert did not link a work order to the customer')

    await completeWorkOrder(wo.id)

    const after = await listCustomers()
    const activated = after.items.find((c) => c.id === created.id)
    expect(activated?.status).toBe('aktif')
  })
})
