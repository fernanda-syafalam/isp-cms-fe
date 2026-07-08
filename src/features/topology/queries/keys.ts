const root = ['topology'] as const

export const topologyKeys = {
  all: root,
  list: () => [...root, 'list'] as const,
}

const croot = ['cabling'] as const

export const cablingKeys = {
  all: croot,
  cables: () => [...croot, 'cables'] as const,
  strands: () => [...croot, 'strands'] as const,
  closures: () => [...croot, 'closures'] as const,
  splices: () => [...croot, 'splices'] as const,
  splitters: () => [...croot, 'splitters'] as const,
  circuits: () => [...croot, 'circuits'] as const,
}
