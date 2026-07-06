import { zodResolver } from '@hookform/resolvers/zod'
import { StarIcon } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'
import { type SubmitCsatInput, SubmitCsatSchema } from '@/schemas/ticket'

import { useSubmitCsat } from '../hooks/usePortal'

type Props = {
  ticketId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RATING_VALUES = [1, 2, 3, 4, 5] as const

// Auto-surfaced once a ticket is resolved/breached — asks the customer to rate
// the resolution (1..5) with an optional comment. Mobile-first.
export function CsatDialog({ ticketId, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Beri penilaian</DialogTitle>
          <DialogDescription>Seberapa puas Anda dengan penanganan laporan ini?</DialogDescription>
        </DialogHeader>
        {ticketId ? <CsatForm ticketId={ticketId} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function CsatForm({ ticketId, onDone }: { ticketId: string; onDone: () => void }) {
  const submit = useSubmitCsat(ticketId)
  const form = useForm<SubmitCsatInput>({
    resolver: zodResolver(SubmitCsatSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: SubmitCsatInput = values.comment
      ? { rating: values.rating, comment: values.comment }
      : { rating: values.rating }
    try {
      await submit.mutateAsync(payload)
      form.reset()
      onDone()
    } catch {
      // useSubmitCsat surfaces a toast.
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex gap-1.5">
                  {RATING_VALUES.map((value) => {
                    const active = field.value >= value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={field.value === value}
                        aria-label={`Beri ${value} bintang`}
                        onClick={() => field.onChange(value)}
                        className="rounded-md p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <StarIcon
                          className={cn(
                            'size-8',
                            active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Komentar (opsional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Ceritakan pengalaman Anda…"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            disabled={form.formState.isSubmitting}
          >
            Nanti saja
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Mengirim…' : 'Kirim penilaian'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
