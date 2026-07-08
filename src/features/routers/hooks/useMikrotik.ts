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
import type { MikrotikListFilter } from '@/api/mikrotik'
import { routerKeys } from '@/features/routers/queries/keys'
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
    queryKey: routerKeys.detail(id),
    queryFn: () => getRouter(id),
  })
}

function useRouterAction(id: string, fn: (id: string) => Promise<unknown>, message: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routerKeys.all })
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
    queryKey: routerKeys.profiles(routerId),
    queryFn: () => listProfiles(routerId),
  })
}

export function useCreateProfile(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProfileInput) => createProfile(routerId, input),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: routerKeys.profiles(routerId) })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: routerKeys.profiles(routerId) }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteProfile(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProfile(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routerKeys.profiles(routerId) })
      toast.success('Profil dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Secrets
export function useSecrets(routerId: string, filter: MikrotikListFilter = {}) {
  return useQuery({
    queryKey: routerKeys.secrets(routerId, filter),
    queryFn: () => listSecrets(routerId, filter),
  })
}

export function useCreateSecret(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSecretInput) => createSecret(routerId, input),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: routerKeys.secretsBase(routerId) })
      qc.invalidateQueries({ queryKey: routerKeys.detail(routerId) })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: routerKeys.secretsBase(routerId) }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteSecret(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSecret(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routerKeys.secretsBase(routerId) })
      qc.invalidateQueries({ queryKey: routerKeys.detail(routerId) })
      toast.success('Secret dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Sessions
export function useSessions(routerId: string, filter: MikrotikListFilter = {}) {
  return useQuery({
    queryKey: routerKeys.sessions(routerId, filter),
    queryFn: () => listSessions(routerId, filter),
  })
}

export function useDisconnectSession(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => disconnectSession(routerId, id),
    onSuccess: () => {
      // Disconnecting drops a session AND flips the owning secret's connection
      // state, so both lists must refetch.
      qc.invalidateQueries({ queryKey: routerKeys.sessionsBase(routerId) })
      qc.invalidateQueries({ queryKey: routerKeys.secretsBase(routerId) })
      toast.success('Sesi diputus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Queues
export function useQueues(routerId: string, filter: MikrotikListFilter = {}) {
  return useQuery({
    queryKey: routerKeys.queues(routerId, filter),
    queryFn: () => listQueues(routerId, filter),
  })
}

export function useCreateQueue(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateQueueInput) => createQueue(routerId, input),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: routerKeys.queuesBase(routerId) })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: routerKeys.queuesBase(routerId) }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteQueue(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQueue(routerId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routerKeys.queuesBase(routerId) })
      toast.success('Queue dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function usePools(routerId: string) {
  return useQuery({
    queryKey: routerKeys.pools(routerId),
    queryFn: () => listPools(routerId),
  })
}

export function useCreatePool(routerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateIpPoolInput) => createPool(routerId, input),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: routerKeys.pools(routerId) })
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
      qc.invalidateQueries({ queryKey: routerKeys.pools(routerId) })
      toast.success('IP pool dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
