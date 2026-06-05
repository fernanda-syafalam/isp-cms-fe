// SLA targets per ticket priority, in hours. Single source of truth shared by
// the mock backend (sets slaDueAt) and the UI (renders the SLA badge).
export const SLA_HOURS: Record<string, number> = {
  urgent: 4,
  high: 8,
  medium: 24,
  low: 72,
}

type SlaTone = 'success' | 'warning' | 'danger' | 'neutral'

export type SlaState = {
  tone: SlaTone
  label: string
  breached: boolean
}

// Derive the SLA badge from a ticket's status + due time relative to `nowMs`.
// Pure (no Date.now) so it stays testable — callers pass the current time.
export function slaState(status: string, slaDueAt: string, nowMs: number): SlaState {
  if (status === 'resolved') return { tone: 'success', label: 'Selesai', breached: false }

  const remainingMs = new Date(slaDueAt).getTime() - nowMs
  if (status === 'breached' || remainingMs <= 0) {
    return { tone: 'danger', label: 'SLA terlampaui', breached: true }
  }

  const hours = Math.floor(remainingMs / 3_600_000)
  let label: string
  if (hours >= 24) label = `${Math.floor(hours / 24)} hari lagi`
  else if (hours >= 1) label = `${hours} jam lagi`
  else label = `${Math.max(1, Math.floor(remainingMs / 60_000))} menit lagi`

  return { tone: hours < 4 ? 'warning' : 'neutral', label, breached: false }
}
