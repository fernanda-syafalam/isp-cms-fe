import { describe, expect, it } from 'vitest'

import { toSearch } from './useTopologySearch'

// toSearch is the URL-serialization contract for the topology view state. The
// router glue (reading useSearch / navigate replace) is verified manually; this
// covers the part most likely to regress: which keys end up in the URL.
// Signature: (view, base, type, status, layer, sel).
describe('toSearch', () => {
  it('omits every key when all values are at their defaults', () => {
    expect(toSearch('map', 'satellite', 'all', 'all', 'logical', null)).toEqual({})
  })

  it('writes only the non-default values', () => {
    expect(toSearch('list', 'satellite', 'all', 'all', 'logical', null)).toEqual({ view: 'list' })
    expect(toSearch('map', 'map', 'all', 'all', 'logical', null)).toEqual({
      base: 'map',
    })
    expect(toSearch('map', 'satellite', 'odp', 'all', 'logical', null)).toEqual({ type: 'odp' })
    expect(toSearch('map', 'satellite', 'all', 'down', 'logical', null)).toEqual({ status: 'down' })
    expect(toSearch('map', 'satellite', 'all', 'all', 'physical', null)).toEqual({
      layer: 'physical',
    })
  })

  it('includes the selected node id only when one is set', () => {
    expect(toSearch('map', 'satellite', 'all', 'all', 'logical', 'odp-1')).toEqual({ sel: 'odp-1' })
    expect(toSearch('map', 'satellite', 'all', 'all', 'logical', null)).not.toHaveProperty('sel')
  })

  it('never emits a legacy `focus` key (selection folds into `sel`)', () => {
    expect(toSearch('list', 'map', 'odp', 'down', 'physical', 'odp-1')).not.toHaveProperty('focus')
  })

  it('combines all non-default values into one object', () => {
    expect(toSearch('list', 'map', 'customer', 'unknown', 'physical', 'cust-9')).toEqual({
      view: 'list',
      base: 'map',
      type: 'customer',
      status: 'unknown',
      layer: 'physical',
      sel: 'cust-9',
    })
  })
})
