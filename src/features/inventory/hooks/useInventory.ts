import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type InventoryFilter,
  deleteInventory,
  listInventory,
  listStockMovements,
  moveInventory,
  stockInInventory,
  updateInventory,
} from '@/api/inventory'
import { getErrorMessage } from '@/lib/errors'
import type {
  MoveInventoryInput,
  StockInInput,
  StockMovementType,
  UpdateInventoryInput,
} from '@/schemas/inventory'

export function useInventoryList(filter: InventoryFilter = {}) {
  return useQuery({
    queryKey: ['inventory', 'list', filter] as const,
    queryFn: () => listInventory(filter),
  })
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['inventory', 'movements'] as const,
    queryFn: listStockMovements,
  })
}

export function useStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: StockInInput) => stockInInventory(input),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Stok masuk: ${item.kind.toUpperCase()} ${item.serial}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

const MOVE_TOAST: Record<Exclude<StockMovementType, 'in'>, string> = {
  assign: 'dipasang',
  return: 'dikembalikan ke gudang',
  broken: 'ditandai rusak',
}

export function useMoveInventory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MoveInventoryInput) => moveInventory(id, input),
    onSuccess: (item, vars) => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Item "${item.serial}" ${MOVE_TOAST[vars.type]}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
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
