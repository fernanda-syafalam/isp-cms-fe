import { api } from './client'
import {
  type Device,
  DeviceListSchema,
  DeviceSchema,
  type DeviceList,
  type UpdateDeviceInput,
} from '@/schemas/device'

export type DeviceFilter = {
  q?: string | undefined
  status?: string | undefined
  type?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 500 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const DEVICE_EXPORT_LIMIT = 500

export async function listDevices(filter: DeviceFilter = {}): Promise<DeviceList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.type) searchParams.set('type', filter.type)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('devices', { searchParams }).json()
  return DeviceListSchema.parse(json)
}

export async function getDevice(id: string): Promise<Device> {
  const json = await api.get(`devices/${id}`).json()
  return DeviceSchema.parse(json)
}

// GenieACS / device reboot (mock now). Returns the device unchanged.
export async function rebootDevice(id: string): Promise<Device> {
  const json = await api.post(`devices/${id}/reboot`).json()
  return DeviceSchema.parse(json)
}

export async function updateDevice(id: string, input: UpdateDeviceInput): Promise<Device> {
  const json = await api.patch(`devices/${id}`, { json: input }).json()
  return DeviceSchema.parse(json)
}

// Decommission: remove the device record from the managed fleet.
export async function deleteDevice(id: string): Promise<void> {
  await api.delete(`devices/${id}`)
}
