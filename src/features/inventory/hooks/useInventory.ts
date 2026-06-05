import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type InventoryFilter,
  deleteInventory,
  listInventory,
  updateInventory,
} from '@/api/inventory'
import { getErrorMessage } from '@/lib/errors'
import type { UpdateInventoryInput } from '@/schemas/inventory'

export function useInventoryList(filter: InventoryFilter = {}) {
  return useQuery({
    queryKey: ['inventory', 'list', filter] as const,
    queryFn: () => listInventory(filter),
  })
}

export function useUpdateInventory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateInventoryInput) => updateInventory(id, input),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Item "${item.serial}" diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInventory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Item dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
