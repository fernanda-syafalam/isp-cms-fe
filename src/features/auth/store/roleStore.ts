import { create } from 'zustand'

import { type Role, isRole } from '@/lib/permissions'

const KEY = 'isp-cms-dev-role'

function loadOverride(): Role | null {
  const value = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY)
  return isRole(value) ? value : null
}

type RoleState = {
  // Dev-only override of the logged-in user's role, so role gating can be tried
  // without separate accounts. Persisted to localStorage. In production builds
  // this is always null and setOverride is a no-op — the override must never
  // influence the effective role a real user sees (FEsec-H1).
  override: Role | null
  setOverride: (role: Role | null) => void
}

export const useRoleStore = create<RoleState>((set) => ({
  // `import.meta.env.DEV` is statically replaced at build time, so in a
  // production bundle this collapses to `null` and `loadOverride` (the
  // localStorage read) is dead code that tree-shakes out.
  override: import.meta.env.DEV ? loadOverride() : null,
  setOverride: (role) => {
    if (!import.meta.env.DEV) return
    if (role) window.localStorage.setItem(KEY, role)
    else window.localStorage.removeItem(KEY)
    set({ override: role })
  },
}))
