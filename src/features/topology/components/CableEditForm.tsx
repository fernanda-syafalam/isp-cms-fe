import type { FormEventHandler } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
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
import {
  type CableKind,
  CableKindSchema,
  type CableStatus,
  CableStatusSchema,
} from '@/schemas/cable'

const KIND_LABEL: Record<CableKind, string> = {
  feeder: 'Feeder',
  distribution: 'Distribusi',
  drop: 'Drop',
}
const STATUS_LABEL: Record<CableStatus, string> = {
  planned: 'Rencana',
  installed: 'Terpasang',
  retired: 'Pensiun',
}

// Editable metadata only — the endpoints (from/to) are structural and the route
// is edited on the map (updateCableRoute), so they're not part of this form.
export const CableEditFormSchema = z.object({
  kind: CableKindSchema,
  spec: z.string().min(1, 'Spesifikasi wajib diisi').max(80),
  fiberCount: z.number().int().positive('Jumlah fiber > 0'),
  tubeCount: z.number().int().positive('Jumlah tube > 0'),
  status: CableStatusSchema,
})
export type CableEditValues = z.infer<typeof CableEditFormSchema>

type Props = {
  form: UseFormReturn<CableEditValues>
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}

export function CableEditForm({ form, onSubmit, onCancel }: Props) {
  const submitting = form.formState.isSubmitting
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Jenis kabel">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as CableKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
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
          name="spec"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spesifikasi</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <CableNumberField form={form} name="fiberCount" label="Jumlah fiber" />
          <CableNumberField form={form} name="tubeCount" label="Jumlah tube" />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Status kabel">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as CableStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function CableNumberField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<CableEditValues>
  name: 'fiberCount' | 'tubeCount'
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
