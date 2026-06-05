import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createProfile,
  createSecret,
  deleteProfile,
  deleteSecret,
  getRouter,
  listProfiles,
  listSecrets,
  rebootRouter,
  syncRouter,
  testRouter,
  updateProfile,
  updateSecret,
} from '@/api/mikrotik'
import { getErrorMessage } from '@/lib/errors'
import type {
  CreateProfileInput,
  CreateSecretInput,
  UpdateProfileInput,
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
