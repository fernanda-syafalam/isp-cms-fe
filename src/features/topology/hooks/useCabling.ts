import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createSplice,
  deleteSplice,
  installCustomerDrop,
  listCables,
  listCircuits,
  listClosures,
  listSplices,
  listSplitters,
  listStrands,
  updateCableRoute,
} from '@/api/cabling'
import { getErrorMessage } from '@/lib/errors'
import type { CustomerDropInput, UpdateCableRouteInput } from '@/schemas/cable'
import type { CreateSpliceInput } from '@/schemas/closure'
import type { NetworkNode } from '@/schemas/topology'

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

// "Pasang pelanggan": provision a subscriber's drop. Invalidates topology (node
// added + projected capacity changed), cabling, and customers (the subscriber
// leaves the install picker).
export function useInstallCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerDropInput) => installCustomerDrop(input),
    onSuccess: (node: NetworkNode) => {
      qc.invalidateQueries({ queryKey: ['topology'] })
      qc.invalidateQueries({ queryKey: ['cabling'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
      toast.success(`Pelanggan "${node.name}" terpasang`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Update a drop cable's surveyed route (waypoints). Invalidates cabling so the
// route + recomputed length refresh on the map.
export function useUpdateCableRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCableRouteInput }) =>
      updateCableRoute(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabling'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Record a fusion/mechanical splice inside a closure. Invalidates cabling so the
// closure's splice list refreshes.
export function useCreateSplice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSpliceInput) => createSplice(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabling'] })
      toast.success('Sambungan ditambahkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Remove a splice from a closure.
export function useDeleteSplice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSplice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabling'] })
      toast.success('Sambungan dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
