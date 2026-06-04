import { api } from './client'
import { DeviceListSchema, type DeviceList } from '@/schemas/device'

export async function listDevices(): Promise<DeviceList> {
  const json = await api.get('devices').json()
  return DeviceListSchema.parse(json)
}
