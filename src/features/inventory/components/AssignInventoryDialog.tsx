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
import type { InventoryItem } from '@/schemas/inventory'

import { useMoveInventory } from '../hooks/useInventory'

const FormSchema = z.object({
  note: z.string().min(1, 'Nama pelanggan wajib diisi').max(120),
})
type FormValues = z.infer<typeof FormSchema>

type Props = {
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignInventoryDialog({ item, open, onOpenChange }: Props) {
  const move = useMoveInventory(item.id)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    values: { note: item.assignedTo ?? '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await move.mutateAsync({ type: 'assign', note: values.note })
      onOpenChange(false)
    } catch {
      // useMoveInventory surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluarkan perangkat</DialogTitle>
          <DialogDescription>
            Pasang {item.kind.toUpperCase()} "{item.serial}" ke pelanggan. Status menjadi terpasang.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dipasang ke (pelanggan)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama pelanggan" autoComplete="off" {...field} />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Keluarkan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
