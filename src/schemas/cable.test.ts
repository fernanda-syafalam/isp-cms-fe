import { describe, expect, it } from 'vitest'

import { CableSchema, StrandAssignmentSchema } from './cable'

const validCable = {
  id: 'cb-1',
  kind: 'drop',
  spec: 'G.652D 12F drop',
  fiberCount: 12,
  tubeCount: 1,
  fromNodeId: 'odp-1',
  toNodeId: 'c1-node',
  route: [
    { lat: -6.55, lng: 110.68 },
    { lat: -6.551, lng: 110.681 },
  ],
  lengthM: 142,
  status: 'installed',
  installedAt: null,
}

describe('CableSchema', () => {
  it('parses a valid cable', () => {
    expect(CableSchema.parse(validCable).kind).toBe('drop')
  })

  it('rejects an unknown kind', () => {
    expect(CableSchema.safeParse({ ...validCable, kind: 'backbone' }).success).toBe(false)
  })
})

describe('StrandAssignmentSchema', () => {
  const strand = {
    id: 'st-1',
    cableId: 'cb-1',
    tubeNo: 1,
    coreNo: 5,
    status: 'allocated',
    circuitId: null,
    customerId: 'c1',
  }

  it('parses a valid strand', () => {
    expect(StrandAssignmentSchema.parse(strand).coreNo).toBe(5)
  })

  it('enforces the 1..12 core range (TIA-598 tube)', () => {
    expect(StrandAssignmentSchema.safeParse({ ...strand, coreNo: 0 }).success).toBe(false)
    expect(StrandAssignmentSchema.safeParse({ ...strand, coreNo: 13 }).success).toBe(false)
    expect(StrandAssignmentSchema.safeParse({ ...strand, coreNo: 12 }).success).toBe(true)
  })
})
