import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import { fiberCore } from '../lib/graph'
import { cableStyle } from './CableLayer'

function node(
  type: NetworkNode['type'],
  status: NetworkNode['status'],
  coreNo?: number,
): NetworkNode {
  return {
    id: `${type}-1`,
    name: type,
    type,
    status,
    lat: 0,
    lng: 0,
    parentId: 'p',
    ...(coreNo ? { meta: { coreNo } } : {}),
  }
}

describe('cableStyle', () => {
  it('draws a drop in its fiber-core color, thin', () => {
    const s = cableStyle(node('customer', 'up', 3), false, false)
    expect(s.color).toBe(fiberCore(3).hex)
    expect(s.weight).toBeLessThan(3)
  })

  it('reddens a down drop', () => {
    expect(cableStyle(node('customer', 'down', 3), false, false).color).toBe('#dc2626')
  })

  it('draws a feeder thick and slate', () => {
    const s = cableStyle(node('odc', 'up'), false, false)
    expect(s.weight).toBeGreaterThan(3)
    expect(s.color).toBe('#64748b')
  })

  it('accents the active circuit blue and dims everything else', () => {
    expect(cableStyle(node('customer', 'up', 3), true, false).color).toBe('#2563eb')
    expect(cableStyle(node('customer', 'up', 3), false, true).opacity).toBeLessThan(0.2)
  })
})
