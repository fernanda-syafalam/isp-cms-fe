import { api } from './client'
import {
  type AcsDeviceList,
  AcsDeviceListSchema,
  type BulkAcsInput,
  type BulkAcsResult,
  BulkAcsResultSchema,
} from '@/schemas/acs'

export async function listAcsDevices(): Promise<AcsDeviceList> {
  const json = await api.get('acs/devices').json()
  return AcsDeviceListSchema.parse(json)
}

// Run a bulk TR-069 task (reboot / firmware / wifi) over selected devices.
export async function bulkAcs(input: BulkAcsInput): Promise<BulkAcsResult> {
  const json = await api.post('acs/bulk', { json: input }).json()
  return BulkAcsResultSchema.parse(json)
}
