import { api } from './client'
import { type Settings, SettingsSchema, type UpdateSettingsInput } from '@/schemas/settings'

export async function getSettings(): Promise<Settings> {
  const json = await api.get('settings').json()
  return SettingsSchema.parse(json)
}

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  const json = await api.patch('settings', { json: input }).json()
  return SettingsSchema.parse(json)
}
