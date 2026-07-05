import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'
import { type PaymentMethod, PaymentMethodSchema } from '@/schemas/payment'

import { usePayInvoice } from '../hooks/useInvoices'

type LoketPayValues = {
  method: PaymentMethod
  amount: number
  tenderedAmount: number
}

// Form schema is parameterised by balanceDue so overpay is a boundary error and
// the cash "uang diterima" must cover the amount being paid (kembalian >= 0).
// Inputs register with valueAsNumber, so an empty field yields NaN -> rejected.
function makePaySchema(balanceDue: number) {
  return z
    .object({
      method: PaymentMethodSchema,
      amount: z
        .number({ message: 'Jumlah wajib diisi' })
        .int()
        .positive('Jumlah harus lebih dari 0')
        .max(balanceDue, 'Jumlah melebihi saldo tertagih'),
      tenderedAmount: z.number({ message: 'Uang diterima wajib diisi' }).int().nonnegative(),
    })
    .superRefine((values, ctx) => {
      if (values.method === 'cash' && values.tenderedAmount < values.amount) {
        ctx.addIssue({
          code: 'custom',
          path: ['tenderedAmount'],
          message: 'Uang diterima kurang dari jumlah bayar',
        })
      }
    })
}

type Props = {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Loket (counter) manual-payment recorder: pick a method, optionally pay a
// partial amount, and — for cash — enter uang diterima to see the kembalian.
export function LoketPayDialog({ invoice, open, onOpenChange }: Props) {
  const pay = usePayInvoice(invoice.id)
  const schema = useMemo(() => makePaySchema(invoice.balanceDue), [invoice.balanceDue])
  const form = useForm<LoketPayValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'cash',
      amount: invoice.balanceDue,
      tenderedAmount: invoice.balanceDue,
    },
  })

  const method = form.watch('method')
  const amount = Number(form.watch('amount')) || 0
  const tendered = Number(form.watch('tenderedAmount')) || 0
  const change = method === 'cash' ? Math.max(tendered - amount, 0) : 0

  const handleSubmit = form.handleSubmit((values) => {
    pay.mutate(
      {
        method: values.method,
        amount: values.amount,
        ...(values.method === 'cash' ? { tenderedAmount: values.tenderedAmount } : {}),
      },
      { onSuccess: () => onOpenChange(false) },
    )
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat pembayaran</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNo} · saldo tertagih {formatCurrency(invoice.balanceDue)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loket-method">Metode</Label>
            <Select
              value={method}
              onValueChange={(v) => form.setValue('method', v as PaymentMethod)}
            >
              <SelectTrigger id="loket-method" className="w-full" aria-label="Metode pembayaran">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PaymentMethodSchema.options.map((m) => (
                  <SelectItem key={m} value={m}>
                    {statusLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loket-amount">Jumlah bayar</Label>
            <Input
              id="loket-amount"
              type="number"
              inputMode="numeric"
              min={1}
              max={invoice.balanceDue}
              aria-invalid={form.formState.errors.amount ? true : undefined}
              aria-describedby={form.formState.errors.amount ? 'loket-amount-error' : undefined}
              {...form.register('amount', { valueAsNumber: true })}
            />
            {form.formState.errors.amount ? (
              <p id="loket-amount-error" className="text-destructive text-sm">
                {form.formState.errors.amount.message}
              </p>
            ) : null}
          </div>

          {method === 'cash' ? (
            <div className="space-y-1.5">
              <Label htmlFor="loket-tendered">Uang diterima</Label>
              <Input
                id="loket-tendered"
                type="number"
                inputMode="numeric"
                min={amount}
                aria-invalid={form.formState.errors.tenderedAmount ? true : undefined}
                aria-describedby={
                  form.formState.errors.tenderedAmount ? 'loket-tendered-error' : undefined
                }
                {...form.register('tenderedAmount', { valueAsNumber: true })}
              />
              {form.formState.errors.tenderedAmount ? (
                <p id="loket-tendered-error" className="text-destructive text-sm">
                  {form.formState.errors.tenderedAmount.message}
                </p>
              ) : null}
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCurrency(change)}
                </span>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pay.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pay.isPending}>
              {pay.isPending ? 'Memproses…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
