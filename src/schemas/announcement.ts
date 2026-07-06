import { z } from 'zod'

// Operator broadcast notice shown on the customer portal (P3.C.4). Severity
// drives the banner styling; `outage` is the most urgent (destructive).
export const AnnouncementSeveritySchema = z.enum(['info', 'warning', 'outage'])

export const AnnouncementSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  severity: AnnouncementSeveritySchema,
  active: z.boolean(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  createdAt: z.string(),
})

export type AnnouncementSeverity = z.infer<typeof AnnouncementSeveritySchema>
export type Announcement = z.infer<typeof AnnouncementSchema>
