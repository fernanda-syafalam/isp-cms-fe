import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createNode, deleteNode, listTopology, updateNode } from '@/api/topology'
import { auditKeys } from '@/features/audit/queries/keys'
import { customerKeys } from '@/features/customers/queries/keys'
import { cablingKeys, topologyKeys } from '@/features/topology/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { CreateNodeInput, UpdateNodeInput } from '@/schemas/topology'

export function useTopology() {
  return useQuery({
    queryKey: topologyKeys.list(),
    queryFn: listTopology,
  })
}

export function useCreateNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateNodeInput) => createNode(input),
    onSuccess: (node) => {
      qc.invalidateQueries({ queryKey: topologyKeys.all })
      qc.invalidateQueries({ queryKey: auditKeys.all })
      toast.success(`Node "${node.name}" ditambahkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNodeInput }) => updateNode(id, input),
    onSuccess: () => {
      // Moving or re-homing a node re-syncs drop-cable geometry and may reassign
      // splitter ports, so refresh the cabling layer alongside the topology.
      qc.invalidateQueries({ queryKey: topologyKeys.all })
      qc.invalidateQueries({ queryKey: cablingKeys.all })
      qc.invalidateQueries({ queryKey: auditKeys.all })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNode(id),
    onSuccess: () => {
      // Deleting a customer node cascade-frees its drop (cabling) and returns
      // the subscriber to the install picker, so refresh both.
      qc.invalidateQueries({ queryKey: topologyKeys.all })
      qc.invalidateQueries({ queryKey: cablingKeys.all })
      qc.invalidateQueries({ queryKey: customerKeys.all })
      qc.invalidateQueries({ queryKey: auditKeys.all })
      toast.success('Node dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
