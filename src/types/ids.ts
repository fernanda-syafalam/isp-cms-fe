import { z } from 'zod'

export const tenantId = z.uuid().brand<'TenantId'>()
export const userId = z.uuid().brand<'UserId'>()
export const clinicId = z.uuid().brand<'ClinicId'>()

export type TenantId = z.infer<typeof tenantId>
export type UserId = z.infer<typeof userId>
export type ClinicId = z.infer<typeof clinicId>
