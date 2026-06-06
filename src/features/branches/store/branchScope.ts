import { create } from 'zustand'

// Global branch scope (null = all branches). Persisted to localStorage so the
// chosen scope survives refresh. Modules consume this as they become
// branch-aware; for now it is the single source of truth for the active scope.
const ID_KEY = 'isp-cms-branch-scope-id'
const NAME_KEY = 'isp-cms-branch-scope-name'

export type BranchScope = { id: string; name: string } | null

function load(): BranchScope {
  if (typeof window === 'undefined') return null
  const id = window.localStorage.getItem(ID_KEY)
  const name = window.localStorage.getItem(NAME_KEY)
  return id && name ? { id, name } : null
}

type BranchScopeState = {
  scope: BranchScope
  setScope: (scope: BranchScope) => void
}

export const useBranchScope = create<BranchScopeState>((set) => ({
  scope: load(),
  setScope: (scope) => {
    if (scope) {
      window.localStorage.setItem(ID_KEY, scope.id)
      window.localStorage.setItem(NAME_KEY, scope.name)
    } else {
      window.localStorage.removeItem(ID_KEY)
      window.localStorage.removeItem(NAME_KEY)
    }
    set({ scope })
  },
}))
