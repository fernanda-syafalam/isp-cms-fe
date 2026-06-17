import type { BranchScope } from '../store/branchScope'

// Service areas (kecamatan) each branch covers — the basis for scoping lists by
// the active branch. Keyed by branch name; together these cover every area, so
// picking any branch yields its real customers (no silent empties).
const BRANCH_AREAS: Record<string, string[]> = {
  'Kantor Pusat Jepara': ['Jepara', 'Tahunan', 'Mlonggo', 'Batealit'],
  'Cabang Pecangaan': ['Pecangaan', 'Kalinyamatan', 'Mayong'],
  'Cabang Bangsri': ['Bangsri'],
}

// Resolve a branch scope to the list of service areas it covers, for sending to
// a server-side `area` filter. Returns null (= no area constraint) when there is
// no scope OR the branch name is unknown, so picking any branch still yields its
// real customers (no silent empties). Unassigned (null-area) customers are NOT
// encoded here; the list endpoint includes them in every scope on its own, so an
// unassigned subscriber is never hidden and ops can always find it.
export function scopeAreas(scope: BranchScope): string[] | null {
  if (!scope) return null
  return BRANCH_AREAS[scope.name] ?? null
}
