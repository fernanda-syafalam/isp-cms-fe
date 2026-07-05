import { api } from './client'
import { type SetupStatus, SetupStatusSchema } from '@/schemas/setup'

// Fetch the operator's first-run setup progress. The server owns every `done`
// flag; we only validate the shape at the boundary.
export async function getSetupStatus(): Promise<SetupStatus> {
  const json = await api.get('setup/status').json()
  return SetupStatusSchema.parse(json)
}
