import { describe, expect, it } from 'vitest'

import type { StrandAssignment } from '@/schemas/cable'
import type { Splitter, SplitterRatio } from '@/schemas/splitter'
import type { NetworkNode } from '@/schemas/topology'

import { fiberId } from './graph'
import { projectNodeMeta } from './projection'

function splitter(nodeId: string, ratio: SplitterRatio, occupied: number): Splitter {
  const count = Number(ratio.split(':')[1])
  return {
    id: `${nodeId}-splitter`,
    nodeId,
    ratio,
    inCableId: null,
    inStrandId: null,
    ports: Array.from({ length: count }, (_, i) => ({
      portNo: i + 1,
      outNodeId: i < occupied ? `out-${i}` : null,
      customerId: null,
      strandId: null,
    })),
  }
}

describe('projectNodeMeta', () => {
  it('merges splitter-derived fields onto an ODP, preserving pass-through meta', () => {
    const odp: NetworkNode = {
      id: 'odp-1',
      name: 'ODP',
      type: 'odp',
      status: 'up',
      lat: 0,
      lng: 0,
      parentId: 'odc-1',
      meta: { rxPowerDbm: -22, uptimePct: 99.8 },
    }
    const [out] = projectNodeMeta([odp], {
      splitters: [splitter('odp-1', '1:8', 3)],
      strands: [],
    })
    expect(out?.meta?.splitter).toBe('1:8')
    expect(out?.meta?.portsTotal).toBe(8)
    expect(out?.meta?.portsUsed).toBe(3)
    // pass-through facts the cabling layer doesn't own must survive
    expect(out?.meta?.rxPowerDbm).toBe(-22)
    expect(out?.meta?.uptimePct).toBe(99.8)
  })

  it('leaves a node with no splitter/strand untouched (OLT keeps model/IP/ports)', () => {
    const olt: NetworkNode = {
      id: 'olt-1',
      name: 'OLT',
      type: 'olt',
      status: 'up',
      lat: 0,
      lng: 0,
      parentId: null,
      meta: {
        model: 'ZTE C320',
        ipAddress: '10.0.0.1',
        portsUsed: 6,
        portsTotal: 16,
      },
    }
    const [out] = projectNodeMeta([olt], { splitters: [], strands: [] })
    expect(out).toBe(olt) // same reference — no projection applied
    expect(out?.meta?.model).toBe('ZTE C320')
    expect(out?.meta?.portsUsed).toBe(6)
  })

  it('projects a customer coreNo back to its seed global number (color-preserving)', () => {
    // seed coreNo 17 → fiberId → tube 2, core 5; the strand stores those, and
    // the projection recomposes the same global number, so colors are identical.
    const fid = fiberId(17)
    const cust: NetworkNode = {
      id: 'c1-node',
      name: 'C1',
      type: 'customer',
      status: 'up',
      lat: 0,
      lng: 0,
      parentId: 'pole-1',
      meta: { customerId: 'c1', planName: 'Home 20', phone: '0812' },
    }
    const strand: StrandAssignment = {
      id: 'st-1',
      cableId: 'cb-1',
      tubeNo: fid.tubeNo,
      coreNo: fid.coreNo,
      status: 'allocated',
      circuitId: null,
      customerId: 'c1',
    }
    const [out] = projectNodeMeta([cust], { splitters: [], strands: [strand] })
    expect(out?.meta?.coreNo).toBe(17)
    // the customer↔topology link + display facts must be preserved
    expect(out?.meta?.customerId).toBe('c1')
    expect(out?.meta?.planName).toBe('Home 20')
    expect(out?.meta?.phone).toBe('0812')
  })
})
