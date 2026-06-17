/**
 * Shared MSW list-query engine. Mirrors the backend list contract so a mock
 * handler can honour `q` (case-insensitive substring across whitelisted
 * fields), `sort`/`order` (whitelisted column + direction), and `limit`/
 * `offset` paging — returning the same `{ items, total }` envelope the real
 * NestJS list endpoints return.
 *
 * Module-specific equality filters (e.g. `status`, `type`, `area`) are applied
 * by the caller BEFORE handing rows here; this helper owns only the parts every
 * list shares. `total` is the count AFTER search but BEFORE paging, so the
 * DataTable can derive its page count.
 *
 * When `limit` is absent the full (searched, sorted) set is returned — this
 * keeps existing non-paginated callers working; server-mode pages always send a
 * `limit`.
 */

type SortValue = string | number | null | undefined

export type ListQueryConfig<T> = {
  /** Fields the `q` param searches (case-insensitive substring match). */
  searchFields: (keyof T)[]
  /**
   * Whitelisted sort keys → value accessor. The whitelist is the contract:
   * a `sort` key absent from this map falls back to `defaultCompare`, never
   * throws (mirrors the backend `buildOrderBy` whitelist boundary).
   */
  sortAccessors: Record<string, (row: T) => SortValue>
  /** Comparator used when `sort` is absent or unknown (mirrors BE default ORDER BY). */
  defaultCompare: (a: T, b: T) => number
}

function compareValues(a: SortValue, b: SortValue): number {
  // Nulls sort last under ascending order (and first under descending).
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function toInt(value: string | null, fallback: number): number {
  if (value == null) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export function applyListQuery<T>(
  rows: T[],
  searchParams: URLSearchParams,
  config: ListQueryConfig<T>,
): { items: T[]; total: number } {
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const sort = searchParams.get('sort') ?? undefined
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc'

  let result = rows
  if (q) {
    result = result.filter((row) =>
      config.searchFields.some((field) => {
        const value = row[field]
        return value != null && String(value).toLowerCase().includes(q)
      }),
    )
  }

  const accessor = sort ? config.sortAccessors[sort] : undefined
  // Copy before sorting — never mutate the shared fixture array.
  result = accessor
    ? [...result].sort((a, b) => {
        const cmp = compareValues(accessor(a), accessor(b))
        return order === 'desc' ? -cmp : cmp
      })
    : [...result].sort(config.defaultCompare)

  const total = result.length
  const offset = toInt(searchParams.get('offset'), 0)
  const hasLimit = searchParams.get('limit') !== null
  const items = hasLimit
    ? result.slice(offset, offset + toInt(searchParams.get('limit'), total))
    : result.slice(offset)
  return { items, total }
}
