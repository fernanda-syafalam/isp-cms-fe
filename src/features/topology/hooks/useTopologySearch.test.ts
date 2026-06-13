import { describe, expect, it } from 'vitest'

import { toSearch } from './useTopologySearch'

// toSearch is the URL-serialization contract for the topology view state. The
// router glue (reading useSearch / navigate replace) is verified manually; this
// covers the part most likely to regress: which keys end up in the URL.
describe('toSearch', () => {
  it('omits every key when all values are at their defaults', () => {
    expect(toSearch('map', 'satellite', 'all', 'all', null)).toEqual({})
  })

  it('writes only the non-default values', () => {
    expect(toSearch('list', 'satellite', 'all', 'all', null)).toEqual({
      view: 'list',
    })
    expect(toSearch('map', 'map', 'all', 'all', null)).toEqual({ base: 'map' })
    expect(toSearch('map', 'satellite', 'odp', 'all', null)).toEqual({
      type: 'odp',
    })
    expect(toSearch('map', 'satellite', 'all', 'down', null)).toEqual({
      status: 'down',
    })
  })

  it('includes the selected node id only when one is set', () => {
    expect(toSearch('map', 'satellite', 'all', 'all', 'odp-1')).toEqual({
      sel: 'odp-1',
    })
    expect(toSearch('map', 'satellite', 'all', 'all', null)).not.toHaveProperty('sel')
  })

  it('never emits a legacy `focus` key (selection folds into `sel`)', () => {
    expect(toSearch('list', 'map', 'odp', 'down', 'odp-1')).not.toHaveProperty('focus')
  })

  it('combines all non-default values into one object', () => {
    expect(toSearch('list', 'map', 'customer', 'unknown', 'cust-9')).toEqual({
      view: 'list',
      base: 'map',
      type: 'customer',
      status: 'unknown',
      sel: 'cust-9',
    })
  })
})
