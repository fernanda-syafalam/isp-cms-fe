import { api } from './client'
import { type Contract, ContractResponseSchema, ContractSchema } from '@/schemas/contract'

export async function getContract(customerId: string): Promise<Contract | null> {
  const json = await api.get(`customers/${customerId}/contract`).json()
  return ContractResponseSchema.parse(json).contract
}

export async function createContract(customerId: string): Promise<Contract> {
  const json = await api.post(`customers/${customerId}/contract`).json()
  return ContractSchema.parse(json)
}

export async function sendContract(customerId: string): Promise<Contract> {
  const json = await api.post(`customers/${customerId}/contract/send`).json()
  return ContractSchema.parse(json)
}

// Mark signed (mock; a real flow returns from the e-signature provider) +
// applies e-Meterai.
export async function signContract(customerId: string): Promise<Contract> {
  const json = await api.post(`customers/${customerId}/contract/sign`).json()
  return ContractSchema.parse(json)
}
