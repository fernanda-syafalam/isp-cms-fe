import { api } from './client'
import { type Device, DeviceListSchema, DeviceSchema, type DeviceList } from '@/schemas/device'

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
