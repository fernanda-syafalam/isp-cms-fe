// Role-based permissions for UI gating. Admin has everything; staff is
// operational (customers, tickets, billing) but can't manage catalog/partners,
// delete/archive records, manage staff, or reset data.

export type Role = 'admin' | 'staff' | 'customer'

export type Permission =
  | 'customers.manage'
  | 'tickets.manage'
  | 'billing.run'
  | 'network.manage'
  | 'plans.manage'
  | 'staff.manage'
  | 'resellers.manage'
  | 'vouchers.manage'
  | 'records.delete'
  | 'data.reset'

const ALL_PERMISSIONS: Permission[] = [
  'customers.manage',
  'tickets.manage',
  'billing.run',
  'network.manage',
  'plans.manage',
  'staff.manage',
  'resellers.manage',
  'vouchers.manage',
  'records.delete',
  'data.reset',
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  staff: ['customers.manage', 'tickets.manage', 'billing.run', 'network.manage', 'vouchers.manage'],
  customer: [],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  staff: 'Staf',
  customer: 'Pelanggan',
}
