import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/test/msw/server'

import { createCustomer, listCustomers } from './customers'
import { convertLead, createLead, listLeads } from './leads'
import { onboardCustomer } from './onboarding'
import { listResellers } from './resellers'

// Referral/reseller attribution (P3.D.2), end-to-end over the MSW layer (server
// from test/setup.ts; resetMockDb runs before each test). Proves the picked
// reseller is persisted onto the customer (as resolved resellerName) on
// onboarding, that direct create sends no resellerId (hidden in the MVP), that
// a lead stores its resellerId, and that
// converting a reseller-sourced lead carries the reseller onto the new customer.

async function firstReseller(): Promise<{ id: string; name: string }> {
  const { items } = await listResellers()
  const target = items[0]
  if (!target) throw new Error('seed has no resellers')
  return { id: target.id, name: target.name }
}

describe('referral attribution', () => {
  it('sends no resellerId on a directly created customer', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('*/api/customers', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ error: 'captured' }, { status: 500 })
      }),
    )
    await createCustomer({
      fullName: 'Pelanggan Tanpa Mitra',
      phone: '081200000002',
      email: '',
      address: 'Jl. Mandiri 2',
      planId: '',
    }).catch(() => undefined)
    expect(body).not.toBeNull()
    expect(body).not.toHaveProperty('resellerId')
  })

  it('persists the reseller name through onboarding', async () => {
    const reseller = await firstReseller()
    const customer = await onboardCustomer({
      fullName: 'Pelanggan Onboarding',
      phone: '081200000003',
      email: '',
      address: 'Jl. Instalasi 3',
      areaName: 'Jepara', // operational area — passes the serviceability gate
      planId: '',
      technician: 'Teknisi Budi',
      scheduledAt: '2026-08-01',
      resellerId: reseller.id,
    })
    expect(customer.resellerName).toBe(reseller.name)
  })

  it('stores the resellerId on a created lead', async () => {
    const reseller = await firstReseller()
    const lead = await createLead({
      name: 'Prospek Mitra',
      phone: '081200000004',
      address: 'Jl. Prospek 4',
      areaName: 'Jepara',
      planName: 'Home 20',
      estValue: 200_000,
      source: 'reseller',
      resellerId: reseller.id,
    })
    expect(lead.resellerId).toBe(reseller.id)
  })

  it('carries the reseller (id → resellerName) onto the customer on convert', async () => {
    const { items } = await listLeads()
    const lead = items.find((l) => l.resellerId)
    if (!lead?.resellerId) throw new Error('seed has no reseller-attributed lead')

    const resellers = await listResellers()
    const expectedName = resellers.items.find((r) => r.id === lead.resellerId)?.name
    expect(expectedName).toBeTruthy()

    await convertLead(lead.id)

    const customers = await listCustomers()
    const created = customers.items.find((c) => c.fullName === lead.name)
    expect(created?.resellerName).toBe(expectedName)
  })
})
