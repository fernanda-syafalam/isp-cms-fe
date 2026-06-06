import { create } from 'zustand'

import { type Role, isRole } from '@/lib/permissions'

const KEY = 'isp-cms-dev-role'

function loadOverride(): Role | null {
  const value = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY)
  return isRole(value) ? value : null
}

type RoleState = {
  // Dev-only override of the logged-in user's role, so role gating can be tried
  // without separate accounts. Persisted to localStorage.
  override: Role | null
  setOverride: (role: Role | null) => void
}

export const useRoleStore = create<RoleState>((set) => ({
  override: loadOverride(),
  setOverride: (role) => {
    if (role) window.localStorage.setItem(KEY, role)
    else window.localStorage.removeItem(KEY)
    set({ override: role })
  },
}))
