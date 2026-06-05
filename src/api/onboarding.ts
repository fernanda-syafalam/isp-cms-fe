import { api } from './client'
import { type Customer, CustomerSchema } from '@/schemas/customer'
import type { OnboardingInput } from '@/schemas/onboarding'

// Creates the customer (status "instalasi") + an install work order in one call.
export async function onboardCustomer(input: OnboardingInput): Promise<Customer> {
  const json = await api.post('onboarding', { json: input }).json()
  return CustomerSchema.parse(json)
}
