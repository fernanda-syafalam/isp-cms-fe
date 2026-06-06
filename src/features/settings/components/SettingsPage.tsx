import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'

import { useSettings, useUpdateSettings } from '../hooks/useSettings'

const FormSchema = z.object({
  company: z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(120),
    address: z.string().max(255),
    phone: z.string().max(40),
    email: z.string().max(120),
  }),
  billing: z.object({
    lateFeeIdr: z.number().int().nonnegative('Tidak boleh negatif').max(10_000_000),
    dueDays: z.number().int().positive('Minimal 1 hari').max(60),
    isolirGraceDays: z.number().int().nonnegative('Tidak boleh negatif').max(60),
  }),
  tax: z.object({
    pkp: z.boolean(),
    npwp: z.string().max(40),
    ppnRate: z.number().nonnegative('Tidak boleh negatif').max(1),
  }),
})
type FormValues = z.infer<typeof FormSchema>

export function SettingsPage() {
  const { data, isLoading, isError } = useSettings()
  const canManage = useCan('settings.manage')
  const update = useUpdateSettings()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader title="Pengaturan" />
        <p className="text-destructive" role="alert">
          Gagal memuat pengaturan.
        </p>
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
  initial: FormValues
  canManage: boolean
  pending: boolean
  onSave: (input: FormValues) => Promise<unknown>
}

function SettingsForm({ initial, canManage, pending, onSave }: SettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil perusahaan</CardTitle>
              <CardDescription>Tampil di faktur, kwitansi, dan kontrak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="company.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama perusahaan</FormLabel>
                      <FormControl>
                        <Input disabled={!canManage} {...field} />
                      </FormControl>
                      <FormDescription>Tampil di faktur & kwitansi.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Input disabled={!canManage} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon</FormLabel>
                        <FormControl>
                          <Input disabled={!canManage} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input disabled={!canManage} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Penagihan</CardTitle>
              <CardDescription>
                Mengatur siklus tagihan, denda, dan ambang isolir otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="billing.lateFeeIdr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Denda (Rp)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            disabled={!canManage}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billing.dueDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo (hari)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            disabled={!canManage}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billing.isolirGraceDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toleransi isolir (hari)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            disabled={!canManage}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pajak (PPN / e-Faktur)</CardTitle>
              <CardDescription>
                Status PKP & tarif PPN efektif yang dipakai saat menghitung tagihan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tax.pkp"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          disabled={!canManage}
                          aria-label="Pengusaha Kena Pajak"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Penerbit adalah Pengusaha Kena Pajak (PKP) — tagihan dikenakan PPN
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tax.npwp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NPWP penerbit</FormLabel>
                        <FormControl>
                          <Input disabled={!canManage} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax.ppnRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarif PPN efektif</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            disabled={!canManage}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>0.11 = 11% (DPP 11/12).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
