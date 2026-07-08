const root = ['auth'] as const

export const authKeys = {
  all: root,
  me: () => [...root, 'me'] as const,
  bootstrap: () => [...root, 'bootstrap'] as const,
}
