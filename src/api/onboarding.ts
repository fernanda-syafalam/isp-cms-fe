import { api } from './client'
import {
  type OnboardResponse,
  OnboardResponseSchema,
  type OnboardingInput,
} from '@/schemas/onboarding'

// Creates the customer (status "instalasi") + an install work order in one call
// and provisions the subscriber's portal login. The response carries the
// one-time `portalLogin.initialPassword` — parse with OnboardResponseSchema so
// it survives to the UI (CustomerSchema would strip it).
export async function onboardCustomer(input: OnboardingInput): Promise<OnboardResponse> {
  const json = await api.post('onboarding', { json: input }).json()
  return OnboardResponseSchema.parse(json)
}
