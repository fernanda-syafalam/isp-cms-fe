import { api } from './client'
import {
  type Device,
  DeviceListSchema,
  DeviceSchema,
  type DeviceList,
  type UpdateDeviceInput,
} from '@/schemas/device'

export async function listDevices(): Promise<DeviceList> {
  const json = await api.get('devices').json()
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
