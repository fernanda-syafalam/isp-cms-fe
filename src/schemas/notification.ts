import { z } from 'zod'

// WhatsApp notification templates + send log (mock-first, contract-ready for a
// real WA Business API / gateway such as Wablas/Fonnte).
export const NotificationChannelSchema = z.literal('whatsapp')

// Lifecycle events a template can be attached to.
export const NotificationEventSchema = z.enum([
  'invoice_created',
  'due_soon',
  'overdue',
  'isolir',
  'paid',
  'ticket_update',
])

export const NotificationTemplateSchema = z.object({
  id: z.string(),
  event: NotificationEventSchema,
  name: z.string(),
  channel: NotificationChannelSchema,
  body: z.string(), // supports {nama} {no_tagihan} {jumlah} {jatuh_tempo}
  enabled: z.boolean(),
})

export const NotificationTemplateListSchema = z.object({
  items: z.array(NotificationTemplateSchema),
  total: z.number().int().nonnegative(),
})

export const UpdateNotificationTemplateSchema = z.object({
  body: z.string().min(1, 'Isi pesan wajib diisi').max(1000).optional(),
  enabled: z.boolean().optional(),
})

export const NotificationStatusSchema = z.enum(['sent', 'failed'])

export const NotificationLogSchema = z.object({
  id: z.string(),
  to: z.string(), // recipient phone
  templateName: z.string(),
  channel: NotificationChannelSchema,
  status: NotificationStatusSchema,
  body: z.string(),
  at: z.iso.datetime(),
})

export const NotificationLogListSchema = z.object({
  items: z.array(NotificationLogSchema),
  total: z.number().int().nonnegative(),
})

// Send a (test) message from a template.
export const SendNotificationSchema = z.object({
  event: NotificationEventSchema,
  to: z.string().min(6, 'Nomor tujuan wajib diisi').max(20),
})

export type NotificationEvent = z.infer<typeof NotificationEventSchema>
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>
export type NotificationTemplateList = z.infer<typeof NotificationTemplateListSchema>
export type UpdateNotificationTemplateInput = z.infer<typeof UpdateNotificationTemplateSchema>
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>
export type NotificationLog = z.infer<typeof NotificationLogSchema>
export type NotificationLogList = z.infer<typeof NotificationLogListSchema>
export type SendNotificationInput = z.infer<typeof SendNotificationSchema>
