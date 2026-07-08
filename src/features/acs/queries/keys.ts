import type { AcsDeviceFilter } from '@/api/acs'

const root = ['acs'] as const

export const acsKeys = {
  all: root,
  devicesBase: () => [...root, 'devices'] as const,
  devices: (filter: AcsDeviceFilter) => [...root, 'devices', filter] as const,
}
