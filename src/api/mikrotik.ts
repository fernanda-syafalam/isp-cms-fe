import { api } from './client'
import { type Router, RouterSchema } from '@/schemas/router'
import {
  type CreateProfileInput,
  type CreateSecretInput,
  type PppProfile,
  PppProfileListSchema,
  PppProfileSchema,
  type PppProfileList,
  type PppSecret,
  PppSecretListSchema,
  PppSecretSchema,
  type PppSecretList,
  type UpdateProfileInput,
  type UpdateSecretInput,
} from '@/schemas/mikrotik'

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
export async function listSecrets(routerId: string): Promise<PppSecretList> {
  const json = await api.get(`routers/${routerId}/secrets`).json()
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
