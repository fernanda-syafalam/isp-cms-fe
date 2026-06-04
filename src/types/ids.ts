import { z } from 'zod'

// Branded ID types so IDs from different domains are never interchangeable.
export const userId = z.uuid().brand<'UserId'>()
export const customerId = z.uuid().brand<'CustomerId'>()
export const planId = z.uuid().brand<'PlanId'>()
export const invoiceId = z.uuid().brand<'InvoiceId'>()
export const deviceId = z.uuid().brand<'DeviceId'>()
export const ticketId = z.uuid().brand<'TicketId'>()
export const areaId = z.uuid().brand<'AreaId'>()

export type UserId = z.infer<typeof userId>
export type CustomerId = z.infer<typeof customerId>
export type PlanId = z.infer<typeof planId>
export type InvoiceId = z.infer<typeof invoiceId>
export type DeviceId = z.infer<typeof deviceId>
export type TicketId = z.infer<typeof ticketId>
export type AreaId = z.infer<typeof areaId>
