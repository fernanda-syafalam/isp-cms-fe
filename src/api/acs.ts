import { api } from './client'
import {
  type AcsDeviceList,
  AcsDeviceListSchema,
  type BulkAcsInput,
  type BulkAcsResult,
  BulkAcsResultSchema,
} from '@/schemas/acs'

export type AcsDeviceFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export async function listAcsDevices(filter: AcsDeviceFilter = {}): Promise<AcsDeviceList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('acs/devices', { searchParams }).json()
  return AcsDeviceListSchema.parse(json)
}

// Run a bulk TR-069 task (reboot / firmware / wifi) over selected devices.
export async function bulkAcs(input: BulkAcsInput): Promise<BulkAcsResult> {
  const json = await api.post('acs/bulk', { json: input }).json()
  return BulkAcsResultSchema.parse(json)
}
