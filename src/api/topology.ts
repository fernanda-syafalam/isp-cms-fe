import { api } from './client'
import {
  type CreateNodeInput,
  type NetworkNode,
  NetworkNodeSchema,
  type Topology,
  TopologySchema,
  type UpdateNodeInput,
} from '@/schemas/topology'

export async function listTopology(): Promise<Topology> {
  const json = await api.get('topology').json()
  return TopologySchema.parse(json)
}

export async function createNode(input: CreateNodeInput): Promise<NetworkNode> {
  const json = await api.post('topology', { json: input }).json()
  return NetworkNodeSchema.parse(json)
}

export async function updateNode(id: string, input: UpdateNodeInput): Promise<NetworkNode> {
  const json = await api.patch(`topology/${id}`, { json: input }).json()
  return NetworkNodeSchema.parse(json)
}

export async function deleteNode(id: string): Promise<void> {
  await api.delete(`topology/${id}`)
}
