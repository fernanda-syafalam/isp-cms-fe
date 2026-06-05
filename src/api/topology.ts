import { api } from './client'
import { type Topology, TopologySchema } from '@/schemas/topology'

export async function listTopology(): Promise<Topology> {
  const json = await api.get('topology').json()
  return TopologySchema.parse(json)
}
