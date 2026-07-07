import { api } from './client'
import {
  type PublicSettings,
  PublicSettingsSchema,
  type Settings,
  SettingsSchema,
  type UpdateSettingsInput,
} from '@/schemas/settings'

export async function getSettings(): Promise<Settings> {
  const json = await api.get('settings').json()
  return SettingsSchema.parse(json)
}

// Invoice-render subset readable by any authenticated role (staff, customer).
export async function getPublicSettings(): Promise<PublicSettings> {
  const json = await api.get('settings/public').json()
  return PublicSettingsSchema.parse(json)
}

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  const json = await api.patch('settings', { json: input }).json()
  return SettingsSchema.parse(json)
}
