import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { connectRouter, listRouters, testRouterConnection } from '@/api/routers'
import { getErrorMessage } from '@/lib/errors'
import type { ConnectRouterInput } from '@/schemas/router'

export function useRoutersList() {
  return useQuery({
    queryKey: ['routers', 'list'] as const,
    queryFn: listRouters,
  })
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
