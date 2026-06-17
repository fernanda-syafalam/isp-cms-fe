import { describe, expect, it } from 'vitest'

import { applyListQuery, type ListQueryConfig } from './listQuery'

type Row = { code: string; name: string; createdAt: string }

const rows: Row[] = [
  { code: 'WO-3', name: 'Charlie', createdAt: '2026-01-03' },
  { code: 'WO-1', name: 'Alice', createdAt: '2026-01-01' },
  { code: 'WO-2', name: 'bravo', createdAt: '2026-01-02' },
]

const config: ListQueryConfig<Row> = {
  searchFields: ['code', 'name'],
  sortAccessors: {
    code: (r) => r.code,
    name: (r) => r.name,
  },
  defaultCompare: (a, b) => b.createdAt.localeCompare(a.createdAt),
}

const params = (init: Record<string, string>) => new URLSearchParams(init)

describe('applyListQuery', () => {
  it('returns all rows in default order when no params are set', () => {
    const { items, total } = applyListQuery(rows, params({}), config)
    expect(total).toBe(3)
    // defaultCompare = createdAt DESC.
    expect(items.map((r) => r.code)).toEqual(['WO-3', 'WO-2', 'WO-1'])
  })

  it('searches case-insensitively across whitelisted fields', () => {
    expect(applyListQuery(rows, params({ q: 'BRAVO' }), config).items).toEqual([
      { code: 'WO-2', name: 'bravo', createdAt: '2026-01-02' },
    ])
    // Matches on the code field too.
    expect(applyListQuery(rows, params({ q: 'wo-1' }), config).items.map((r) => r.code)).toEqual([
      'WO-1',
    ])
  })

  it('sorts by a whitelisted key in both directions', () => {
    expect(
      applyListQuery(rows, params({ sort: 'name', order: 'asc' }), config).items.map((r) => r.name),
    ).toEqual(['Alice', 'bravo', 'Charlie'])
    expect(
      applyListQuery(rows, params({ sort: 'name', order: 'desc' }), config).items.map(
        (r) => r.name,
      ),
    ).toEqual(['Charlie', 'bravo', 'Alice'])
  })

  it('falls back to defaultCompare for an unknown sort key', () => {
    const { items } = applyListQuery(rows, params({ sort: 'evil', order: 'asc' }), config)
    expect(items.map((r) => r.code)).toEqual(['WO-3', 'WO-2', 'WO-1'])
  })

  it('paginates with limit/offset and keeps total as the pre-page count', () => {
    const { items, total } = applyListQuery(
      rows,
      params({ sort: 'code', order: 'asc', limit: '2', offset: '1' }),
      config,
    )
    expect(total).toBe(3)
    expect(items.map((r) => r.code)).toEqual(['WO-2', 'WO-3'])
  })

  it('does not mutate the source array', () => {
    const before = rows.map((r) => r.code)
    applyListQuery(rows, params({ sort: 'code', order: 'desc' }), config)
    expect(rows.map((r) => r.code)).toEqual(before)
  })
})
