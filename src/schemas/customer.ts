import { z } from 'zod'

import { areaId, customerId, planId } from '@/types/ids'

// Lifecycle state machine (see docs/FEATURES.md §1). Drives billing + network.
export const CustomerStatusSchema = z.enum(['prospek', 'instalasi', 'aktif', 'isolir', 'berhenti'])

export const ConnectionTypeSchema = z.enum(['pppoe', 'gpon'])

// Network connection for an active subscriber. Null while prospek/instalasi.
export const ConnectionSchema = z.object({
  type: ConnectionTypeSchema,
  pppoeUsername: z.string(),
  profile: z.string(),
  ipAddress: z.string(),
  // GPON / ONU details (null for pure PPPoE-over-copper/wireless).
  onuSerial: z.string().nullable(),
  olt: z.string().nullable(),
  ponPort: z.string().nullable(),
  rxPower: z.number().nullable(), // optical RX power in dBm (redaman)
})

export const CustomerSchema = z.object({
  id: customerId,
  customerNo: z.string(),
  fullName: z.string().min(1),
  phone: z.string(),
  email: z.email().nullable(),
  address: z.string(),
  areaId: areaId,
  areaName: z.string(),
  planId: planId,
  planName: z.string(),
  status: CustomerStatusSchema,
  outstanding: z.number().int().nonnegative(), // piutang (IDR)
  resellerName: z.string().nullable(),
  connection: ConnectionSchema.nullable(),
  joinedAt: z.iso.datetime(),
})

export const CustomerListSchema = z.object({
  items: z.array(CustomerSchema),
  total: z.number().int().nonnegative(),
})

// GenieACS WiFi change (TR-069 SetParameterValues) for a subscriber's ONU.
export const SetWifiSchema = z.object({
  ssid: z.string().min(1, 'SSID wajib diisi').max(32),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(63),
})

export const CreateCustomerSchema = z.object({
  fullName: z.string().min(1, 'Nama wajib diisi').max(120),
  phone: z.string().min(6, 'Telepon wajib diisi').max(20),
  email: z.email('Email tidak valid').or(z.literal('')),
  address: z.string().min(1, 'Alamat wajib diisi').max(255),
  planId: z.string().min(1, 'Paket wajib dipilih'),
})

export const ChangePlanSchema = z.object({
  planId: z.string().min(1, 'Paket wajib dipilih'),
})

export type CustomerStatus = z.infer<typeof CustomerStatusSchema>
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>
export type Connection = z.infer<typeof ConnectionSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type CustomerList = z.infer<typeof CustomerListSchema>
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type SetWifiInput = z.infer<typeof SetWifiSchema>
export type ChangePlanInput = z.infer<typeof ChangePlanSchema>
