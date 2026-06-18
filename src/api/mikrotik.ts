import { api } from './client'
import { type Router, RouterSchema } from '@/schemas/router'
import {
  type CreateIpPoolInput,
  type CreateProfileInput,
  type CreateSecretInput,
  type IpPool,
  IpPoolListSchema,
  type IpPoolList,
  IpPoolSchema,
  type PppProfile,
  PppProfileListSchema,
  PppProfileSchema,
  type PppProfileList,
  type PppSecret,
  PppSecretListSchema,
  PppSecretSchema,
  type PppSecretList,
  type CreateQueueInput,
  PppSessionListSchema,
  type PppSessionList,
  type SimpleQueue,
  SimpleQueueListSchema,
  SimpleQueueSchema,
  type SimpleQueueList,
  type UpdateProfileInput,
  type UpdateQueueInput,
  type UpdateSecretInput,
} from '@/schemas/mikrotik'

// Server-side list params shared by the paginated PPP lists (secrets, sessions).
// Mirrors the backend contract: `q` search, single `sort`/`order` column,
// `limit`/`offset` paging. Undefined fields are omitted from the query string.
export type MikrotikListFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

function toSearchParams(filter: MikrotikListFilter): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  return searchParams
}

export async function getRouter(id: string): Promise<Router> {
  const json = await api.get(`routers/${id}`).json()
  return RouterSchema.parse(json)
}

// Router-level actions (mock): sync pushes config, reboot, test connection.
export async function syncRouter(id: string): Promise<Router> {
  const json = await api.post(`routers/${id}/sync`).json()
  return RouterSchema.parse(json)
}

export async function rebootRouter(id: string): Promise<Router> {
  const json = await api.post(`routers/${id}/reboot`).json()
  return RouterSchema.parse(json)
}

export async function testRouter(id: string): Promise<Router> {
  const json = await api.post(`routers/${id}/test`).json()
  return RouterSchema.parse(json)
}

// PPP profiles
export async function listProfiles(routerId: string): Promise<PppProfileList> {
  const json = await api.get(`routers/${routerId}/profiles`).json()
  return PppProfileListSchema.parse(json)
}

export async function createProfile(
  routerId: string,
  input: CreateProfileInput,
): Promise<PppProfile> {
  const json = await api.post(`routers/${routerId}/profiles`, { json: input }).json()
  return PppProfileSchema.parse(json)
}

export async function updateProfile(
  routerId: string,
  id: string,
  input: UpdateProfileInput,
): Promise<PppProfile> {
  const json = await api.patch(`routers/${routerId}/profiles/${id}`, { json: input }).json()
  return PppProfileSchema.parse(json)
}

export async function deleteProfile(routerId: string, id: string): Promise<void> {
  await api.delete(`routers/${routerId}/profiles/${id}`)
}

// PPPoE secrets
export async function listSecrets(
  routerId: string,
  filter: MikrotikListFilter = {},
): Promise<PppSecretList> {
  const json = await api
    .get(`routers/${routerId}/secrets`, {
      searchParams: toSearchParams(filter),
    })
    .json()
  return PppSecretListSchema.parse(json)
}

export async function createSecret(routerId: string, input: CreateSecretInput): Promise<PppSecret> {
  const json = await api.post(`routers/${routerId}/secrets`, { json: input }).json()
  return PppSecretSchema.parse(json)
}

export async function updateSecret(
  routerId: string,
  id: string,
  input: UpdateSecretInput,
): Promise<PppSecret> {
  const json = await api.patch(`routers/${routerId}/secrets/${id}`, { json: input }).json()
  return PppSecretSchema.parse(json)
}

export async function deleteSecret(routerId: string, id: string): Promise<void> {
  await api.delete(`routers/${routerId}/secrets/${id}`)
}

// Active sessions
export async function listSessions(
  routerId: string,
  filter: MikrotikListFilter = {},
): Promise<PppSessionList> {
  const json = await api
    .get(`routers/${routerId}/sessions`, {
      searchParams: toSearchParams(filter),
    })
    .json()
  return PppSessionListSchema.parse(json)
}

export async function disconnectSession(routerId: string, id: string): Promise<void> {
  await api.post(`routers/${routerId}/sessions/${id}/disconnect`)
}

// Simple queues
export async function listQueues(
  routerId: string,
  filter: MikrotikListFilter = {},
): Promise<SimpleQueueList> {
  const json = await api
    .get(`routers/${routerId}/queues`, {
      searchParams: toSearchParams(filter),
    })
    .json()
  return SimpleQueueListSchema.parse(json)
}

export async function createQueue(routerId: string, input: CreateQueueInput): Promise<SimpleQueue> {
  const json = await api.post(`routers/${routerId}/queues`, { json: input }).json()
  return SimpleQueueSchema.parse(json)
}

export async function updateQueue(
  routerId: string,
  id: string,
  input: UpdateQueueInput,
): Promise<SimpleQueue> {
  const json = await api.patch(`routers/${routerId}/queues/${id}`, { json: input }).json()
  return SimpleQueueSchema.parse(json)
}

export async function deleteQueue(routerId: string, id: string): Promise<void> {
  await api.delete(`routers/${routerId}/queues/${id}`)
}

// IP pools — address ranges PPPoE clients are provisioned from.
export async function listPools(routerId: string): Promise<IpPoolList> {
  const json = await api.get(`routers/${routerId}/pools`).json()
  return IpPoolListSchema.parse(json)
}

export async function createPool(routerId: string, input: CreateIpPoolInput): Promise<IpPool> {
  const json = await api.post(`routers/${routerId}/pools`, { json: input }).json()
  return IpPoolSchema.parse(json)
}

export async function deletePool(routerId: string, id: string): Promise<void> {
  await api.delete(`routers/${routerId}/pools/${id}`)
}
