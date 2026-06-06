import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import type { LedgerEntryType } from '@/schemas/reseller'

import { useAddLedgerEntry } from '../hooks/useResellers'

const FormSchema = z.object({
  amount: z.number().int().positive('Jumlah harus lebih dari 0'),
  note: z.string().max(200),
})
type FormValues = z.infer<typeof FormSchema>

const COPY: Record<
  LedgerEntryType,
  { title: string; description: string; submit: string; defaultNote: string }
> = {
  topup: {
    title: 'Top-up deposit',
    description: 'Menambah saldo deposit reseller.',
    submit: 'Tambah deposit',
    defaultNote: 'Setoran deposit',
  },
  commission: {
    title: 'Catat komisi',
    description: 'Mengkreditkan komisi ke saldo reseller.',
    submit: 'Catat komisi',
    defaultNote: 'Komisi periode berjalan',
  },
  deduction: {
    title: 'Potongan saldo',
    description: 'Mengurangi saldo (mis. biaya aktivasi pelanggan).',
    submit: 'Catat potongan',
    defaultNote: 'Potongan aktivasi',
  },
  withdrawal: {
    title: 'Tarik saldo',
    description: 'Penarikan saldo deposit reseller.',
    submit: 'Tarik saldo',
    defaultNote: 'Penarikan saldo',
  },
}

type Props = {
  resellerId: string
  type: LedgerEntryType
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultAmount?: number
}

export function LedgerEntryDialog({
  resellerId,
  type,
  open,
  onOpenChange,
  defaultAmount = 0,
}: Props) {
  const copy = COPY[type]
  const add = useAddLedgerEntry(resellerId)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    values: { amount: defaultAmount, note: copy.defaultNote },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await add.mutateAsync({ type, amount: values.amount, note: values.note })
      onOpenChange(false)
    } catch {
      // useAddLedgerEntry surfaces a toast (e.g. insufficient balance).
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : copy.submit}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
