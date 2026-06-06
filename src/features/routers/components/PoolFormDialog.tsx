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
import { CreateIpPoolSchema, type CreateIpPoolInput } from '@/schemas/mikrotik'

import { useCreatePool } from '../hooks/useMikrotik'

type Props = {
  routerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PoolFormDialog({ routerId, open, onOpenChange }: Props) {
  const create = useCreatePool(routerId)

  const form = useForm<CreateIpPoolInput>({
    resolver: zodResolver(CreateIpPoolSchema),
    values: { name: '', ranges: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values)
      form.reset({ name: '', ranges: '' })
      onOpenChange(false)
    } catch {
      // useCreatePool surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah IP pool</DialogTitle>
          <DialogDescription>Rentang IP untuk alokasi PPPoE pelanggan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama pool</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder="pool-pppoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ranges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rentang IP</FormLabel>
                  <FormControl>
                    <Input className="font-mono" placeholder="10.10.0.2-10.10.0.254" {...field} />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
