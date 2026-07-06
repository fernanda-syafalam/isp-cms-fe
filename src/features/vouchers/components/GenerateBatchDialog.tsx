import { zodResolver } from '@hookform/resolvers/zod'
import { TicketIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { ResellerSelectField } from '@/features/resellers/components/ResellerSelectField'
import { GenerateVoucherBatchSchema, type GenerateVoucherBatchInput } from '@/schemas/voucher'

import { useGenerateVoucherBatch } from '../hooks/useVouchers'

const DEFAULTS: GenerateVoucherBatchInput = {
  count: 10,
  profile: 'Hotspot 1 Hari',
  priceIdr: 5000,
  durationDays: 1,
  resellerId: null,
}

export function GenerateBatchDialog() {
  const [open, setOpen] = useState(false)
  const generate = useGenerateVoucherBatch()

  const form = useForm<GenerateVoucherBatchInput>({
    resolver: zodResolver(GenerateVoucherBatchSchema),
    defaultValues: DEFAULTS,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await generate.mutateAsync(values)
      form.reset(DEFAULTS)
      setOpen(false)
    } catch {
      // useGenerateVoucherBatch surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <TicketIcon className="size-4" />
          <span className="hidden sm:inline">Buat batch</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat batch voucher</DialogTitle>
          <DialogDescription>
            Membuat sejumlah voucher prepaid dengan profil, harga, dan masa aktif yang sama.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profil</FormLabel>
                  <FormControl>
                    <Input placeholder="cth. Hotspot 1 Hari" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={500}
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
                name="priceIdr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
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
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Masa aktif (hari)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
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
            <ResellerSelectField control={form.control} name="resellerId" />
            <FormDescription>
              Maksimal 500 voucher per batch. Batch dapat diatribusikan ke satu mitra/reseller.
            </FormDescription>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Membuat…' : 'Buat batch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
