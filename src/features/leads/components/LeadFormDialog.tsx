import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePlansList } from '@/features/plans'
import { statusLabel } from '@/lib/status-label'
import { CreateLeadSchema, type CreateLeadInput, type LeadSource } from '@/schemas/lead'

import { useCreateLead } from '../hooks/useLeads'

const SOURCES: LeadSource[] = ['walk_in', 'referral', 'online', 'reseller']

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadFormDialog({ open, onOpenChange }: Props) {
  const create = useCreateLead()
  const plansQuery = usePlansList()
  const plans = plansQuery.data

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      areaName: '',
      planName: '',
      estValue: 0,
      source: 'walk_in',
      note: '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values)
      form.reset()
      onOpenChange(false)
    } catch {
      // useCreateLead surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prospek baru</DialogTitle>
          <DialogDescription>Catat calon pelanggan untuk pipeline penjualan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telepon</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="areaName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="planName"
                render={({ field }) => {
                  const noPlans =
                    !plansQuery.isLoading && !plansQuery.isError && (plans?.items.length ?? 0) === 0
                  return (
                    <FormItem>
                      <FormLabel>Paket diminati</FormLabel>
                      <Select
                        value={field.value}
                        disabled={plansQuery.isLoading || plansQuery.isError}
                        onValueChange={(name) => {
                          field.onChange(name)
                          const plan = plans?.items.find((p) => p.name === name)
                          if (plan) form.setValue('estValue', plan.priceMonthly)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                plansQuery.isLoading
                                  ? 'Memuat paket…'
                                  : plansQuery.isError
                                    ? 'Gagal memuat paket'
                                    : 'Pilih paket'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plans?.items.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {plansQuery.isError ? (
                        <button
                          type="button"
                          onClick={() => plansQuery.refetch()}
                          className="justify-self-start text-destructive text-xs underline-offset-2 hover:underline"
                        >
                          Gagal memuat paket. Coba lagi.
                        </button>
                      ) : noPlans ? (
                        <p className="text-muted-foreground text-xs">Belum ada paket aktif.</p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sumber</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
