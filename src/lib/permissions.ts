// Role-based permissions for UI gating. Admin has everything; staff is
// operational (customers, tickets, billing); teknisi is field network + tickets;
// mitra (partner/reseller) and customer are self-service (view-only).

export type Role = 'admin' | 'staff' | 'teknisi' | 'mitra' | 'customer'

// All roles, in switcher/display order.
export const ROLES: Role[] = ['admin', 'staff', 'teknisi', 'mitra', 'customer']

export function isRole(value: string | null | undefined): value is Role {
  return (
    value === 'admin' ||
    value === 'staff' ||
    value === 'teknisi' ||
    value === 'mitra' ||
    value === 'customer'
  )
}

export type Permission =
  | 'customers.manage'
  | 'tickets.manage'
  | 'billing.run'
  | 'network.manage'
  | 'plans.manage'
  | 'staff.manage'
  | 'resellers.manage'
  | 'vouchers.manage'
  | 'settings.manage'
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
  'settings.manage',
  'records.delete',
  'data.reset',
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  staff: ['customers.manage', 'tickets.manage', 'billing.run', 'network.manage', 'vouchers.manage'],
  // Field technician: works the network (topology/devices/WO) and updates tickets.
  teknisi: ['network.manage', 'tickets.manage'],
  // Partner/reseller and customer are view-only self-service.
  mitra: [],
  customer: [],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  staff: 'Staf',
  teknisi: 'Teknisi',
  mitra: 'Mitra',
  customer: 'Pelanggan',
}
