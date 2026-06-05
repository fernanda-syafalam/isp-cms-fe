import { z } from 'zod'

// Branded ID types so IDs from different domains are never interchangeable.
export const userId = z.uuid().brand<'UserId'>()
export const customerId = z.uuid().brand<'CustomerId'>()
export const planId = z.uuid().brand<'PlanId'>()
export const invoiceId = z.uuid().brand<'InvoiceId'>()
export const paymentId = z.uuid().brand<'PaymentId'>()
export const deviceId = z.uuid().brand<'DeviceId'>()
export const routerId = z.uuid().brand<'RouterId'>()
export const ticketId = z.uuid().brand<'TicketId'>()
export const workOrderId = z.uuid().brand<'WorkOrderId'>()
export const resellerId = z.uuid().brand<'ResellerId'>()
export const inventoryId = z.uuid().brand<'InventoryId'>()
export const areaId = z.uuid().brand<'AreaId'>()

export type UserId = z.infer<typeof userId>
export type CustomerId = z.infer<typeof customerId>
export type PlanId = z.infer<typeof planId>
export type InvoiceId = z.infer<typeof invoiceId>
export type PaymentId = z.infer<typeof paymentId>
export type DeviceId = z.infer<typeof deviceId>
export type RouterId = z.infer<typeof routerId>
export type TicketId = z.infer<typeof ticketId>
export type WorkOrderId = z.infer<typeof workOrderId>
export type ResellerId = z.infer<typeof resellerId>
export type InventoryId = z.infer<typeof inventoryId>
export type AreaId = z.infer<typeof areaId>
