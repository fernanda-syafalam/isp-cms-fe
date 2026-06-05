// Shared validateSearch for list routes that keep their status filter in the
// URL (so the filter is bookmarkable + deep-linkable from the dashboard).
export function statusSearch(search: Record<string, unknown>): {
  status?: string
} {
  return typeof search.status === 'string' ? { status: search.status } : {}
}
