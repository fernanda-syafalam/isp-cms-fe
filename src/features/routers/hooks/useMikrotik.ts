import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createPool,
  createProfile,
  createQueue,
  createSecret,
  deletePool,
  deleteProfile,
  deleteQueue,
  deleteSecret,
  disconnectSession,
  getRouter,
  listPools,
  listProfiles,
  listQueues,
  listSecrets,
  listSessions,
  rebootRouter,
  syncRouter,
  testRouter,
  updateProfile,
  updateQueue,
  updateSecret,
} from '@/api/mikrotik'
import { getErrorMessage } from '@/lib/errors'
import type {
  CreateIpPoolInput,
  CreateProfileInput,
  CreateQueueInput,
  CreateSecretInput,
  UpdateProfileInput,
  UpdateQueueInput,
  UpdateSecretInput,
} from '@/schemas/mikrotik'

export function useRouter(id: string) {
  return useQuery({
    queryKey: ['routers', 'detail', id] as const,
    queryFn: () => getRouter(id),
  })
}

function useRouterAction(id: string, fn: (id: string) => Promise<unknown>, message: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routers'] })
      toast.success(message)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export const useSyncRouter = (id: string) =>
  useRouterAction(id, syncRouter, 'Konfigurasi disinkronkan')
export const useRebootRouter = (id: string) =>
  useRouterAction(id, rebootRouter, 'Perintah reboot dikirim')
export const useTestRouter = (id: string) => useRouterAction(id, testRouter, 'Koneksi router OK')

// Profiles
export function useProfiles(routerId: string) {
  return useQuery({
    queryKey: ['routers', routerId, 'profiles'] as const,
    queryFn: () => listProfiles(routerId),
  })
}

export function useCreateProfile(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProfileInput) => createProfile(routerId, input),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'profiles'] })
      toast.success(`Profil "${p.name}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateProfile(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProfileInput }) =>
      updateProfile(routerId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routers', routerId, 'profiles'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteProfile(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProfile(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'profiles'] })
      toast.success('Profil dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Secrets
export function useSecrets(routerId: string) {
  return useQuery({
    queryKey: ['routers', routerId, 'secrets'] as const,
    queryFn: () => listSecrets(routerId),
  })
}

export function useCreateSecret(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSecretInput) => createSecret(routerId, input),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'secrets'] })
      qc.invalidateQueries({ queryKey: ['routers', 'detail', routerId] })
      toast.success(`Secret "${s.username}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateSecret(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSecretInput }) =>
      updateSecret(routerId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routers', routerId, 'secrets'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteSecret(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSecret(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'secrets'] })
      qc.invalidateQueries({ queryKey: ['routers', 'detail', routerId] })
      toast.success('Secret dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Sessions
export function useSessions(routerId: string) {
  return useQuery({
    queryKey: ['routers', routerId, 'sessions'] as const,
    queryFn: () => listSessions(routerId),
  })
}

export function useDisconnectSession(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => disconnectSession(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'sessions'] })
      toast.success('Sesi diputus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Queues
export function useQueues(routerId: string) {
  return useQuery({
    queryKey: ['routers', routerId, 'queues'] as const,
    queryFn: () => listQueues(routerId),
  })
}

export function useCreateQueue(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateQueueInput) => createQueue(routerId, input),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'queues'] })
      toast.success(`Queue "${q.name}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateQueue(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQueueInput }) =>
      updateQueue(routerId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routers', routerId, 'queues'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteQueue(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQueue(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'queues'] })
      toast.success('Queue dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function usePools(routerId: string) {
  return useQuery({
    queryKey: ['routers', routerId, 'pools'] as const,
    queryFn: () => listPools(routerId),
  })
}

export function useCreatePool(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateIpPoolInput) => createPool(routerId, input),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'pools'] })
      toast.success(`IP pool "${p.name}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeletePool(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePool(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routers', routerId, 'pools'] })
      toast.success('IP pool dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
