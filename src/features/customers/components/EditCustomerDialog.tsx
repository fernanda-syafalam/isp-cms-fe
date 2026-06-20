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
import { CreateCustomerSchema, type CreateCustomerInput, type Customer } from '@/schemas/customer'

import { useUpdateCustomer } from '../hooks/useCustomers'
import { PlanSelectField } from './PlanSelectField'

type Props = {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCustomerDialog({ customer, open, onOpenChange }: Props) {
  const updateMutation = useUpdateCustomer(customer.id)

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    values: {
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address,
      planId: customer.planId,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // useUpdateCustomer surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit pelanggan</DialogTitle>
          <DialogDescription>Perbarui data pelanggan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
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
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telepon</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opsional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PlanSelectField control={form.control} name="planId" />
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
