import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  listNotificationLog,
  listNotificationTemplates,
  sendNotification,
  updateNotificationTemplate,
} from '@/api/notifications'
import { getErrorMessage } from '@/lib/errors'
import type { SendNotificationInput, UpdateNotificationTemplateInput } from '@/schemas/notification'

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['notifications', 'templates'] as const,
    queryFn: listNotificationTemplates,
  })
}

export function useNotificationLog() {
  return useQuery({
    queryKey: ['notifications', 'log'] as const,
    queryFn: listNotificationLog,
  })
}

export function useUpdateNotificationTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateNotificationTemplateInput) => updateNotificationTemplate(id, input),
    onSuccess: (tpl) => {
      qc.invalidateQueries({ queryKey: ['notifications', 'templates'] })
      toast.success(`Template "${tpl.name}" disimpan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SendNotificationInput) => sendNotification(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'log'] })
      toast.success('Pesan uji terkirim via WhatsApp')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
