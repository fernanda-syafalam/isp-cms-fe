import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { listInvoices } from '@/api/invoices'
import { listTickets } from '@/api/tickets'
import { server } from '@/test/msw/server'
import { TestProviders } from '@/test/helpers'

import { useCustomerInvoices } from './useCustomerInvoices'
import { useCustomerTickets } from './useCustomerTickets'

async function firstWithCustomer() {
  const { items } = await listInvoices()
  const inv = items[0]
  if (!inv) throw new Error('seed has no invoices')
  return inv.customerId
}

describe('customer detail hooks (server filter)', () => {
  afterEach(() => {
    server.events.removeAllListeners()
  })

  it('useCustomerInvoices sends customerId (no limit) and returns only that customer', async () => {
    const customerId = await firstWithCustomer()
    const seen: URL[] = []
    server.events.on('request:start', ({ request }) => {
      seen.push(new URL(request.url))
    })
    const { result } = renderHook(() => useCustomerInvoices(customerId), { wrapper: TestProviders })
    await waitFor(() => expect(result.current.data).toBeDefined())

    const req = seen.find((u) => u.pathname.endsWith('/invoices'))
    expect(req?.searchParams.get('customerId')).toBe(customerId)
    expect(req?.searchParams.has('limit')).toBe(false)
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.every((i) => i.customerId === customerId)).toBe(true)
  })

  it('useCustomerTickets sends customerId (no limit) and returns only that customer', async () => {
    const { items } = await listTickets()
    const withCustomer = items.find((t) => t.customerId !== null)
    if (!withCustomer?.customerId) throw new Error('seed has no linked tickets')
    const customerId = withCustomer.customerId
    const seen: URL[] = []
    server.events.on('request:start', ({ request }) => {
      seen.push(new URL(request.url))
    })
    const { result } = renderHook(() => useCustomerTickets(customerId, withCustomer.customerName), {
      wrapper: TestProviders,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())

    const req = seen.find((u) => u.pathname.endsWith('/tickets'))
    expect(req?.searchParams.get('customerId')).toBe(customerId)
    expect(req?.searchParams.has('limit')).toBe(false)
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.every((t) => t.customerId === customerId)).toBe(true)
  })

  it('useCustomerTickets stays disabled without a customerId', () => {
    const { result } = renderHook(() => useCustomerTickets(undefined), { wrapper: TestProviders })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('invoices safety net: old backend ignores customerId, honours limit', async () => {
    const all = await listInvoices()
    const customerId = await firstWithCustomer()
    const seen: URL[] = []
    server.use(
      http.get('*/api/invoices', ({ request }) => {
        const url = new URL(request.url)
        seen.push(url)
        const limit = url.searchParams.get('limit')
        const items = limit ? all.items.slice(0, Number(limit)) : all.items
        return HttpResponse.json({ ...all, items })
      }),
    )
    const { result } = renderHook(() => useCustomerInvoices(customerId), { wrapper: TestProviders })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(seen[0]?.searchParams.get('customerId')).toBe(customerId)
    expect(seen[0]?.searchParams.has('limit')).toBe(false)
    expect(all.items.some((i) => i.customerId !== customerId)).toBe(true)
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.every((i) => i.customerId === customerId)).toBe(true)
  })

  it('tickets safety net: old backend ignores customerId; unlinked row matched by name', async () => {
    const all = await listTickets()
    const linked = all.items.find((t) => t.customerId !== null)
    if (!linked?.customerId) throw new Error('seed has no linked tickets')
    const customerId = linked.customerId
    const unlinked = { ...linked, id: crypto.randomUUID() as typeof linked.id, customerId: null }
    const rows = [...all.items, unlinked]
    const seen: URL[] = []
    server.use(
      http.get('*/api/tickets', ({ request }) => {
        const url = new URL(request.url)
        seen.push(url)
        const limit = url.searchParams.get('limit')
        const items = limit ? rows.slice(0, Number(limit)) : rows
        return HttpResponse.json({ ...all, items })
      }),
    )
    const { result } = renderHook(() => useCustomerTickets(customerId, linked.customerName), {
      wrapper: TestProviders,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(seen[0]?.searchParams.get('customerId')).toBe(customerId)
    expect(seen[0]?.searchParams.has('limit')).toBe(false)
    const data = result.current.data ?? []
    expect(data.some((t) => t.id === unlinked.id)).toBe(true)
    expect(data.every((t) => t.customerId === customerId || t.customerId === null)).toBe(true)
    expect(data.every((t) => t.customerName === linked.customerName)).toBe(true)
  })
})
