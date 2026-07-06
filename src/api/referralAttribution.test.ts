import { describe, expect, it } from 'vitest'

import { createCustomer, listCustomers } from './customers'
import { convertLead, createLead, listLeads } from './leads'
import { onboardCustomer } from './onboarding'
import { listResellers } from './resellers'

// Referral/reseller attribution (P3.D.2), end-to-end over the MSW layer (server
// from test/setup.ts; resetMockDb runs before each test). Proves the picked
// reseller is persisted onto the created customer (as resolved resellerName) on
// direct create + onboarding, that a lead stores its resellerId, and that
// converting a reseller-sourced lead carries the reseller onto the new customer.

async function firstReseller(): Promise<{ id: string; name: string }> {
  const { items } = await listResellers()
  const target = items[0]
  if (!target) throw new Error('seed has no resellers')
  return { id: target.id, name: target.name }
}

describe('referral attribution', () => {
  it('persists the reseller name on a directly created customer', async () => {
    const reseller = await firstReseller()
    const customer = await createCustomer({
      fullName: 'Pelanggan Referral',
      phone: '081200000001',
      email: '',
      address: 'Jl. Referral 1',
      planId: '',
      resellerId: reseller.id,
    })
    expect(customer.resellerName).toBe(reseller.name)
  })

  it('leaves resellerName null when no reseller is chosen', async () => {
    const customer = await createCustomer({
      fullName: 'Pelanggan Tanpa Mitra',
      phone: '081200000002',
      email: '',
      address: 'Jl. Mandiri 2',
      planId: '',
      resellerId: null,
    })
    expect(customer.resellerName).toBeNull()
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
