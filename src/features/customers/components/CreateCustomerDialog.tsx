import { zodResolver } from '@hookform/resolvers/zod'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CreateCustomerSchema, type CreateCustomerInput } from '@/schemas/customer'

import { useCreateCustomer } from '../hooks/useCustomers'
import { PlanSelectField } from './PlanSelectField'

export function CreateCustomerDialog() {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateCustomer()

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      planId: '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      form.reset()
      setOpen(false)
    } catch {
      // useCreateCustomer surfaces a toast; swallow to avoid an unhandled reject.
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Pelanggan baru</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat pelanggan</DialogTitle>
          <DialogDescription>Daftarkan pelanggan baru.</DialogDescription>
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
                    <Input placeholder="Budi Santoso" autoComplete="off" {...field} />
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
                    <Input placeholder="0812xxxxxxx" {...field} />
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
                    <Input type="email" placeholder="budi@example.com" {...field} />
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
                    <Input placeholder="Jl. Merdeka No. 1" {...field} />
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
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Buat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
