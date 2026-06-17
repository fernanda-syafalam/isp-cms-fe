import type { BranchScope } from '../store/branchScope'

// Service areas (kecamatan) each branch covers — the basis for scoping lists by
// the active branch. Keyed by branch name; together these cover every area, so
// picking any branch yields its real customers (no silent empties).
const BRANCH_AREAS: Record<string, string[]> = {
  'Kantor Pusat Jepara': ['Jepara', 'Tahunan', 'Mlonggo', 'Batealit'],
  'Cabang Pecangaan': ['Pecangaan', 'Kalinyamatan', 'Mayong'],
  'Cabang Bangsri': ['Bangsri'],
}

// Whether an area falls under the active branch scope (null scope = all areas).
// An unassigned customer (areaName null) belongs to no branch's coverage; show
// it in every scope rather than silently hiding it, so ops can still find it.
export function areaInScope(areaName: string | null, scope: BranchScope): boolean {
  if (!scope) return true
  if (areaName === null) return true
  const areas = BRANCH_AREAS[scope.name]
  return areas ? areas.includes(areaName) : true
}
