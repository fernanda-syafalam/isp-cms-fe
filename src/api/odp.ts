import { api } from './client'
import { type OdpList, OdpListSchema } from '@/schemas/odp'

export async function listOdp(): Promise<OdpList> {
  const json = await api.get('odp').json()
  return OdpListSchema.parse(json)
}
