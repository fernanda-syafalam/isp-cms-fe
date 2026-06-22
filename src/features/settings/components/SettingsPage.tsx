import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { FormSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useCan } from '@/features/auth'

import { useSettings, useUpdateSettings } from '../hooks/useSettings'
import { SettingsBillingFields } from './SettingsBillingFields'
import { SettingsCompanyFields } from './SettingsCompanyFields'
import { type SettingsFormValues, SettingsFormSchema } from './settingsFormSchema'
import { SettingsTaxFields } from './SettingsTaxFields'

export function SettingsPage() {
  const { data, isLoading, isError, refetch } = useSettings()
  const canManage = useCan('settings.manage')
  const update = useUpdateSettings()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeaderSkeleton />
        <FormSkeleton fields={4} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader title="Pengaturan" />
        <ErrorState title="Gagal memuat pengaturan." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <SettingsForm
      initial={data}
      canManage={canManage}
      pending={update.isPending}
      onSave={update.mutateAsync}
    />
  )
}

type SettingsFormProps = {
  initial: SettingsFormValues
  canManage: boolean
  pending: boolean
  onSave: (input: SettingsFormValues) => Promise<unknown>
}

function SettingsForm({ initial, canManage, pending, onSave }: SettingsFormProps) {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema),
    values: initial,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSave(values)
    } catch {
      // useUpdateSettings surfaces a toast.
    }
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Profil perusahaan, parameter penagihan, dan pajak."
      />
      <Form {...form}>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <SettingsCompanyFields control={form.control} canManage={canManage} />
          <SettingsBillingFields control={form.control} canManage={canManage} />
          <SettingsTaxFields control={form.control} canManage={canManage} />

          {canManage ? (
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-border border-t bg-background/80 py-3 backdrop-blur">
              {form.formState.isDirty ? (
                <span className="mr-auto text-muted-foreground text-sm">
                  Ada perubahan yang belum disimpan.
                </span>
              ) : null}
              <Button type="submit" disabled={pending || !form.formState.isDirty}>
                {pending ? 'Menyimpan…' : 'Simpan perubahan'}
              </Button>
            </div>
          ) : null}
        </form>
      </Form>
    </div>
  )
}
