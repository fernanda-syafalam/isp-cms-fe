import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  connectRouter,
  listRouters,
  ROUTER_EXPORT_LIMIT,
  type RouterFilter,
  testRouterConnection,
} from '@/api/routers'
import { getErrorMessage } from '@/lib/errors'
import type { ConnectRouterInput, RouterList } from '@/schemas/router'

export function useRoutersList(filter: RouterFilter = {}) {
  return useQuery({
    queryKey: ['routers', 'list', filter] as const,
    queryFn: () => listRouters(filter),
  })
}

// Export the full filtered set (server pagination keeps only the page in the
// table) by fetching a single max-size page through the query cache.
export function useExportRouters() {
  const qc = useQueryClient()
  return (filter: RouterFilter): Promise<RouterList> => {
    const exportFilter: RouterFilter = {
      ...filter,
      limit: ROUTER_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['routers', 'list', exportFilter] as const,
      queryFn: () => listRouters(exportFilter),
    })
  }
}

export function useTestRouterConnection() {
  return useMutation({
    mutationFn: (input: ConnectRouterInput) => testRouterConnection(input),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useConnectRouter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ConnectRouterInput) => connectRouter(input),
    onSuccess: (router) => {
      qc.invalidateQueries({ queryKey: ['routers'] })
      toast.success(`Router "${router.name}" terhubung`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
