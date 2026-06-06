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
import { CreateSlaCreditSchema, type CreateSlaCreditInput } from '@/schemas/slaCredit'

import { useCreateSlaCredit } from '../hooks/useSlaCredits'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SlaCreditFormDialog({ open, onOpenChange }: Props) {
  const create = useCreateSlaCredit()

  const form = useForm<CreateSlaCreditInput>({
    resolver: zodResolver(CreateSlaCreditSchema),
    defaultValues: { customerName: '', amount: 0, reason: '', ticketCode: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values)
      form.reset()
      onOpenChange(false)
    } catch {
      // useCreateSlaCredit surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terbitkan kredit SLA</DialogTitle>
          <DialogDescription>
            Kompensasi atas pelanggaran SLA / gangguan; dipotong dari tagihan berikutnya.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pelanggan</FormLabel>
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nominal (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ticketCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode tiket (opsional)</FormLabel>
                    <FormControl>
                      <Input className="font-mono" placeholder="TKT-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan</FormLabel>
                  <FormControl>
                    <Input placeholder="Gangguan 2 hari di area X" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Terbitkan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
