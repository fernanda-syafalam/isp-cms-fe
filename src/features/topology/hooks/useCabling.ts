import { useQuery } from '@tanstack/react-query'

import {
  listCables,
  listCircuits,
  listClosures,
  listSplices,
  listSplitters,
  listStrands,
} from '@/api/cabling'

// Read hooks for the OSP cabling layer (cables/strands/splitters/closures/
// splices/circuits). The map's physical layer and the entity detail panels
// consume these. Keys are namespaced under 'cabling'; cabling mutations (install
// flow) invalidate both ['cabling'] and ['topology'] since node.meta is a
// projection of cabling.
export function useCables() {
  return useQuery({
    queryKey: ['cabling', 'cables'] as const,
    queryFn: listCables,
  })
}

export function useStrands() {
  return useQuery({
    queryKey: ['cabling', 'strands'] as const,
    queryFn: listStrands,
  })
}

export function useClosures() {
  return useQuery({
    queryKey: ['cabling', 'closures'] as const,
    queryFn: listClosures,
  })
}

export function useSplices() {
  return useQuery({
    queryKey: ['cabling', 'splices'] as const,
    queryFn: listSplices,
  })
}

export function useSplitters() {
  return useQuery({
    queryKey: ['cabling', 'splitters'] as const,
    queryFn: listSplitters,
  })
}

export function useCircuits() {
  return useQuery({
    queryKey: ['cabling', 'circuits'] as const,
    queryFn: listCircuits,
  })
}
