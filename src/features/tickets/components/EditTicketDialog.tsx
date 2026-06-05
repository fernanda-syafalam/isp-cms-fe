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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { statusLabel } from '@/lib/status-label'
import { TicketPrioritySchema, type Ticket } from '@/schemas/ticket'

import { useUpdateTicket } from '../hooks/useTickets'

const UNASSIGNED = 'unassigned'
const TECHNICIANS = ['Agent Sari', 'Teknisi Budi', 'Teknisi Joko']
const PRIORITIES = TicketPrioritySchema.options

const FormSchema = z.object({
  subject: z.string().min(1, 'Subjek wajib diisi').max(160),
  priority: TicketPrioritySchema,
  assignee: z.string(),
})
type FormValues = z.infer<typeof FormSchema>

type Props = {
  ticket: Ticket
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTicketDialog({ ticket, open, onOpenChange }: Props) {
  const updateMutation = useUpdateTicket(ticket.id)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    values: {
      subject: ticket.subject,
      priority: ticket.priority,
      assignee: ticket.assignee ?? UNASSIGNED,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        subject: values.subject,
        priority: values.priority,
        assignee: values.assignee === UNASSIGNED ? null : values.assignee,
      })
      onOpenChange(false)
    } catch {
      // useUpdateTicket surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit tiket {ticket.code}</DialogTitle>
          <DialogDescription>Perbarui subjek, prioritas, dan teknisi.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjek</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioritas</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label="Prioritas">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {statusLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teknisi</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label="Teknisi">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Belum ditugaskan</SelectItem>
                      {TECHNICIANS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
