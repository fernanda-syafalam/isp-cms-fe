const root = ['portal'] as const

export const portalKeys = {
  all: root,
  me: () => [...root, 'me'] as const,
  usage: () => [...root, 'usage'] as const,
  wifi: () => [...root, 'wifi'] as const,
  announcements: () => [...root, 'announcements'] as const,
  ticket: (id: string) => [...root, 'ticket', id] as const,
}
