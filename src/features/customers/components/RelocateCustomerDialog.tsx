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
import { SERVICE_AREAS } from '@/lib/areas'
import {
  RelocateCustomerSchema,
  type Customer,
  type RelocateCustomerInput,
} from '@/schemas/customer'

import { useRelocateCustomer } from '../hooks/useCustomers'

type Props = {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RelocateCustomerDialog({ customer, open, onOpenChange }: Props) {
  const relocate = useRelocateCustomer(customer.id)

  const form = useForm<RelocateCustomerInput>({
    resolver: zodResolver(RelocateCustomerSchema),
    values: { address: customer.address, areaName: customer.areaName },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await relocate.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // useRelocateCustomer surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mutasi alamat</DialogTitle>
          <DialogDescription>
            Pindahkan pelanggan "{customer.fullName}" ke alamat / area layanan baru.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat baru</FormLabel>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Mutasi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
