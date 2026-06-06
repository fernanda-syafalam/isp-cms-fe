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

export async function listRouters(): Promise<RouterList> {
  const json = await api.get('routers').json()
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
