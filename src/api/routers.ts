import { api } from './client'
import {
  type ConnectRouterInput,
  type Router,
  type RouterList,
  RouterListSchema,
  RouterSchema,
  type TestConnectionResult,
  TestConnectionResultSchema,
} from '@/schemas/router'

export type RouterFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const ROUTER_EXPORT_LIMIT = 200

export async function listRouters(filter: RouterFilter = {}): Promise<RouterList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('routers', { searchParams }).json()
  return RouterListSchema.parse(json)
}

// Probe a RouterOS device (API host/port + credentials) before saving it —
// returns its identity, board-name (model), and version.
export async function testRouterConnection(
  input: ConnectRouterInput,
): Promise<TestConnectionResult> {
  const json = await api.post('routers/test-connection', { json: input }).json()
  return TestConnectionResultSchema.parse(json)
}

export async function connectRouter(input: ConnectRouterInput): Promise<Router> {
  const json = await api.post('routers', { json: input }).json()
  return RouterSchema.parse(json)
}
