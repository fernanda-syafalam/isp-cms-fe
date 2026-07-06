import { zodResolver } from '@hookform/resolvers/zod'
import { LifeBuoyIcon } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type ReportIssueInput, ReportIssueSchema } from '@/schemas/portal'
import { TicketCategorySchema } from '@/schemas/ticket'

import { useReportIssue } from '../hooks/usePortal'
import { TICKET_CATEGORY_LABEL } from '../lib/ticketCategory'

const CATEGORY_OPTIONS = TicketCategorySchema.options

export function ReportIssueDialog() {
  const [open, setOpen] = useState(false)
  const report = useReportIssue()

  const form = useForm<ReportIssueInput>({
    resolver: zodResolver(ReportIssueSchema),
    defaultValues: { subject: '', category: 'koneksi_putus', photoUrl: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await report.mutateAsync(values)
      form.reset()
      setOpen(false)
    } catch {
      // useReportIssue surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LifeBuoyIcon className="size-4" />
          Lapor gangguan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lapor gangguan</DialogTitle>
          <DialogDescription>
            Ceritakan kendala layanan Anda. Tim teknis kami akan menindaklanjuti.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis keluhan</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label="Jenis keluhan">
                        <SelectValue placeholder="Pilih jenis keluhan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {TICKET_CATEGORY_LABEL[c]}
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keluhan</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="cth. Internet sering putus sejak kemarin malam"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tautan foto (opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://…"
                      autoComplete="off"
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
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Mengirim…' : 'Kirim laporan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
