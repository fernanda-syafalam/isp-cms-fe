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
import { UpdateKycSchema, type Customer, type UpdateKycInput } from '@/schemas/customer'

import { useUpdateKyc } from '../hooks/useCustomers'

type Props = {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KycDialog({ customer, open, onOpenChange }: Props) {
  const update = useUpdateKyc(customer.id)

  const form = useForm<UpdateKycInput>({
    resolver: zodResolver(UpdateKycSchema),
    values: { ktp: customer.ktp ?? '', npwp: customer.npwp ?? '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // useUpdateKyc surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data KYC</DialogTitle>
          <DialogDescription>
            Identitas pelanggan untuk verifikasi (UU PDP). Simpan seperlunya.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="ktp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK / KTP</FormLabel>
                  <FormControl>
                    <Input className="font-mono" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="npwp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPWP (opsional)</FormLabel>
                  <FormControl>
                    <Input className="font-mono" autoComplete="off" {...field} />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
