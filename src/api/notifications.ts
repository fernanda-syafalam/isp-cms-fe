import { api } from './client'
import {
  type NotificationLogList,
  NotificationLogListSchema,
  type NotificationTemplate,
  type NotificationTemplateList,
  NotificationTemplateListSchema,
  NotificationTemplateSchema,
  type SendNotificationInput,
  type UpdateNotificationTemplateInput,
} from '@/schemas/notification'

export async function listNotificationTemplates(): Promise<NotificationTemplateList> {
  const json = await api.get('notifications/templates').json()
  return NotificationTemplateListSchema.parse(json)
}

export async function updateNotificationTemplate(
  id: string,
  input: UpdateNotificationTemplateInput,
): Promise<NotificationTemplate> {
  const json = await api.patch(`notifications/templates/${id}`, { json: input }).json()
  return NotificationTemplateSchema.parse(json)
}

export type NotificationLogFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export async function listNotificationLog(
  filter: NotificationLogFilter = {},
): Promise<NotificationLogList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('notifications/log', { searchParams }).json()
  return NotificationLogListSchema.parse(json)
}

// Send a (test) message; the real gateway call happens server-side.
export async function sendNotification(input: SendNotificationInput): Promise<void> {
  await api.post('notifications/send', { json: input })
}
