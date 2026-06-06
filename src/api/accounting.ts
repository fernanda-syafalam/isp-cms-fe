import { api } from './client'
import { type Journal, JournalSchema } from '@/schemas/accounting'

export async function getJournal(period: string): Promise<Journal> {
  const json = await api.get('accounting/journal', { searchParams: { period } }).json()
  return JournalSchema.parse(json)
}
