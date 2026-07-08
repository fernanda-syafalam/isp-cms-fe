import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  INVENTORY_EXPORT_LIMIT,
  type InventoryFilter,
  STOCK_MOVEMENT_EXPORT_LIMIT,
  type StockMovementFilter,
  deleteInventory,
  listInventory,
  listStockMovements,
  moveInventory,
  stockInInventory,
  updateInventory,
} from '@/api/inventory'
import { inventoryKeys } from '@/features/inventory/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type {
  MoveInventoryInput,
  StockInInput,
  StockMovementType,
  UpdateInventoryInput,
} from '@/schemas/inventory'

export function useInventoryList(filter: InventoryFilter = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(filter),
    queryFn: () => listInventory(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered inventory set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportInventory() {
  const qc = useQueryClient()
  return (filter: InventoryFilter = {}) => {
    const exportFilter: InventoryFilter = {
      ...filter,
      limit: INVENTORY_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: inventoryKeys.list(exportFilter),
      queryFn: () => listInventory(exportFilter),
    })
  }
}

export function useStockMovements(filter: StockMovementFilter = {}) {
  return useQuery({
    queryKey: inventoryKeys.movements(filter),
    queryFn: () => listStockMovements(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered movement history (one
 * max-size page) for CSV export. With server pagination the table holds only
 * the current page, so export must re-query without the page window.
 */
export function useExportStockMovements() {
  const qc = useQueryClient()
  return (filter: StockMovementFilter = {}) => {
    const exportFilter: StockMovementFilter = {
      ...filter,
      limit: STOCK_MOVEMENT_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: inventoryKeys.movements(exportFilter),
      queryFn: () => listStockMovements(exportFilter),
    })
  }
}

export function useStockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: StockInInput) => stockInInventory(input),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all })
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
      qc.invalidateQueries({ queryKey: inventoryKeys.all })
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
      qc.invalidateQueries({ queryKey: inventoryKeys.all })
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
      qc.invalidateQueries({ queryKey: inventoryKeys.all })
      toast.success('Item dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
