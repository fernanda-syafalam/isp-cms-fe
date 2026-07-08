import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  listNotificationLog,
  type NotificationLogFilter,
  listNotificationTemplates,
  sendNotification,
  updateNotificationTemplate,
} from '@/api/notifications'
import { notificationKeys } from '@/features/notifications/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { SendNotificationInput, UpdateNotificationTemplateInput } from '@/schemas/notification'

export function useNotificationTemplates() {
  return useQuery({
    queryKey: notificationKeys.templates(),
    queryFn: listNotificationTemplates,
  })
}

export function useNotificationLog(filter: NotificationLogFilter = {}) {
  return useQuery({
    queryKey: notificationKeys.log(filter),
    queryFn: () => listNotificationLog(filter),
  })
}

export function useUpdateNotificationTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateNotificationTemplateInput) => updateNotificationTemplate(id, input),
    onSuccess: (tpl) => {
      qc.invalidateQueries({ queryKey: notificationKeys.templates() })
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
      qc.invalidateQueries({ queryKey: notificationKeys.logBase() })
      toast.success('Pesan uji terkirim via WhatsApp')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
