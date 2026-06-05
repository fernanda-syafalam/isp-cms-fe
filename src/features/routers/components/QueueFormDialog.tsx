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
import { CreateQueueSchema, type CreateQueueInput, type SimpleQueue } from '@/schemas/mikrotik'

import { useCreateQueue, useUpdateQueue } from '../hooks/useMikrotik'

type Props = {
  routerId: string
  queue?: SimpleQueue
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueueFormDialog({ routerId, queue, open, onOpenChange }: Props) {
  const isEdit = Boolean(queue)
  const create = useCreateQueue(routerId)
  const update = useUpdateQueue(routerId)

  const form = useForm<CreateQueueInput>({
    resolver: zodResolver(CreateQueueSchema),
    values: {
      name: queue?.name ?? '',
      target: queue?.target ?? '',
      maxLimit: queue?.maxLimit ?? '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (queue) await update.mutateAsync({ id: queue.id, input: values })
      else await create.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // mutation hooks surface a toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit queue' : 'Tambah queue'}</DialogTitle>
          <DialogDescription>Simple queue (batas bandwidth) per target.</DialogDescription>
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
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target (IP / subnet)</FormLabel>
                  <FormControl>
                    <Input className="font-mono" placeholder="100.64.0.10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max limit (rx/tx)</FormLabel>
                  <FormControl>
                    <Input className="font-mono" placeholder="20M/20M" {...field} />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
