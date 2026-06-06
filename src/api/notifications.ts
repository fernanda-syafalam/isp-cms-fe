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

export async function listNotificationLog(): Promise<NotificationLogList> {
  const json = await api.get('notifications/log').json()
  return NotificationLogListSchema.parse(json)
}

// Send a (test) message; the real gateway call happens server-side.
export async function sendNotification(input: SendNotificationInput): Promise<void> {
  await api.post('notifications/send', { json: input })
}
