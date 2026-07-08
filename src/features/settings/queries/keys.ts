const root = ['settings'] as const

export const settingsKeys = {
  all: root,
  public: () => [...root, 'public'] as const,
}
