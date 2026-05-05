import { create } from 'zustand'

import type { User } from '@/schemas/auth'

type AuthState = {
  accessToken: string | null
  user: User | null
  setSession: (session: { accessToken: string; user: User }) => void
  setAccessToken: (token: string) => void
  clear: () => void
}

// Access token lives in memory only (CLAUDE.md security baseline).
// Refresh token is an HttpOnly cookie owned by the backend.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: ({ accessToken, user }) => set({ accessToken, user }),
  setAccessToken: (token) => set({ accessToken: token }),
  clear: () => set({ accessToken: null, user: null }),
}))
