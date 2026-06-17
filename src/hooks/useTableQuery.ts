import type { SortingState } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { useDebounce } from './useDebounce'

/**
 * Server list query params derived from table state. Mirrors the backend list
 * contract: `limit`/`offset` paging, `q` full-text search, and a single
 * `sort`/`order` column. Undefined fields are omitted by the api layer.
 */
export type TableQueryParams = {
  limit: number
  offset: number
  q: string | undefined
  sort: string | undefined
  order: 'asc' | 'desc' | undefined
}

type UseTableQueryOptions = {
  /** Rows per page (defaults to 20). */
  pageSize?: number
  /** Debounce for the search box before it hits the server (defaults to 300ms). */
  searchDelayMs?: number
}

/**
 * Drives a server-paginated DataTable: owns page/sort/search state, debounces
 * the search, and resets to the first page whenever the result set changes so
 * the user never lands on an out-of-range page. Returns both the state to feed
 * the table (`pageIndex`, `pageSize`, `sorting`, `search`, change handlers) and
 * the `params` to feed the list query.
 */
export function useTableQuery(options: UseTableQueryOptions = {}) {
  const { pageSize: initialPageSize = 20, searchDelayMs = 300 } = options
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, searchDelayMs)

  const onSearchChange = (value: string) => {
    setSearch(value)
    setPageIndex(0)
  }

  const onSortingChange = (next: SortingState) => {
    setSorting(next)
    setPageIndex(0)
  }

  const onPaginationChange = (next: { pageIndex: number; pageSize: number }) => {
    if (next.pageSize !== pageSize) {
      setPageSize(next.pageSize)
      setPageIndex(0)
      return
    }
    setPageIndex(next.pageIndex)
  }

  const params = useMemo<TableQueryParams>(() => {
    const first = sorting[0]
    return {
      limit: pageSize,
      offset: pageIndex * pageSize,
      q: debouncedSearch.trim() || undefined,
      sort: first?.id,
      order: first ? (first.desc ? 'desc' : 'asc') : undefined,
    }
  }, [pageSize, pageIndex, debouncedSearch, sorting])

  return {
    params,
    pageIndex,
    pageSize,
    sorting,
    search,
    onSearchChange,
    onSortingChange,
    onPaginationChange,
  }
}
