const root = ['setup'] as const

export const setupKeys = {
  all: root,
  status: () => [...root, 'status'] as const,
}
