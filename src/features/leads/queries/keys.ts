const root = ['leads'] as const

export const leadKeys = {
  all: root,
  list: () => [...root, 'list'] as const,
}
