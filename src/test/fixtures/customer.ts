import { CustomerSchema } from '@/schemas/customer'

export const EDIT_TEST_CUSTOMER = CustomerSchema.parse({
  id: '11111111-1111-4111-8111-111111111111',
  customerNo: 'CUST-0001',
  fullName: 'Budi Santoso',
  phone: '081234567890',
  email: 'budi@example.com',
  address: 'Jl. Merdeka 1',
  areaId: '22222222-2222-4222-8222-222222222222',
  areaName: 'Jepara',
  planId: '33333333-3333-4333-8333-333333333333',
  planName: 'Home 50 Mbps',
  status: 'aktif',
  outstanding: 0,
  billingAnchorDay: 15,
  npwp: null,
  ktp: null,
  consentAt: null,
  resellerName: null,
  connection: null,
  joinedAt: '2026-01-01T00:00:00.000Z',
})
