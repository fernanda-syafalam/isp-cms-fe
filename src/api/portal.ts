import { api } from './client'
import { type PortalMe, PortalMeSchema, type ReportIssueInput } from '@/schemas/portal'

// The current customer's self-service snapshot.
export async function getPortalMe(): Promise<PortalMe> {
  const json = await api.get('portal/me').json()
  return PortalMeSchema.parse(json)
}

// Customer reports a problem → opens a support ticket.
export async function reportIssue(input: ReportIssueInput): Promise<void> {
  await api.post('portal/tickets', { json: input })
}
