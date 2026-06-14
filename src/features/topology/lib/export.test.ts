import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import { nodesToCsvRows } from './export'

const olt: NetworkNode = {
  id: 'olt-1',
  name: 'OLT Pusat',
  type: 'olt',
  status: 'up',
  lat: -6.55,
  lng: 110.68,
  parentId: null,
}

const cust: NetworkNode = {
  id: 'c1-node',
  name: 'Budi',
  type: 'customer',
  status: 'up',
  lat: -6.56,
  lng: 110.69,
  parentId: 'olt-1',
  meta: {
    customerId: 'c1',
    coreNo: 5,
    rxPowerDbm: -22,
    phone: '0812',
    onuSerial: 'ZTEG1',
    lifecycle: 'aktif',
  },
}

describe('nodesToCsvRows', () => {
  const byId = new Map([olt, cust].map((n) => [n.id, n]))

  it('flattens node + meta into Indonesian-headed rows', () => {
    const [row] = nodesToCsvRows([cust], byId)
    expect(row).toMatchObject({
      Nama: 'Budi',
      Tipe: 'Pelanggan',
      Status: 'Up',
      Layanan: 'aktif',
      Uplink: 'OLT Pusat', // parentId resolved to the parent's name
      Core: 5,
      'RX (dBm)': -22,
      Telepon: '0812',
      ONU: 'ZTEG1',
    })
  })

  it('leaves inapplicable fields empty rather than undefined', () => {
    const [row] = nodesToCsvRows([olt], byId)
    expect(row?.Uplink).toBe('') // root has no parent
    expect(row?.Core).toBe('')
    expect(row?.Telepon).toBe('')
    expect(row?.Pemeliharaan).toBe('')
  })
})
