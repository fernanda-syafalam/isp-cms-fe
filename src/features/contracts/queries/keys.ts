const root = ['contracts'] as const

export const contractKeys = {
  all: root,
  detail: (customerId: string) => [...root, customerId] as const,
}
