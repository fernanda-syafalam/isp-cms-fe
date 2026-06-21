import type { FormEventHandler } from 'react'
import type { UseFormReturn } from 'react-hook-form'

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
import type { CableKind } from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { TYPE_LABEL } from '../lib/graph'
import type { CableFormValues } from './cableFormSchema'

const KIND_LABEL: Record<CableKind, string> = {
  feeder: 'Feeder (OLT→ODC)',
  distribution: 'Distribusi (ODC→ODP)',
  drop: 'Drop (ODP→pelanggan)',
}

type Props = {
  form: UseFormReturn<CableFormValues>
  options: NetworkNode[]
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}

export function CableForm({ form, options, onSubmit, onCancel }: Props) {
  const submitting = form.formState.isSubmitting
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <NodeSelectField
          form={form}
          name="fromNodeId"
          label="Dari node"
          placeholder="Pilih node awal"
          options={options}
        />
        <NodeSelectField
          form={form}
          name="toNodeId"
          label="Ke node"
          placeholder="Pilih node akhir"
          options={options}
        />
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
                <Input placeholder="mis. G.652D 12F loose-tube" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <CableNumberField form={form} name="fiberCount" label="Jumlah fiber" />
          <CableNumberField form={form} name="tubeCount" label="Jumlah tube" />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Tambah'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function NodeSelectField({
  form,
  name,
  label,
  placeholder,
  options,
}: {
  form: UseFormReturn<CableFormValues>
  name: 'fromNodeId' | 'toNodeId'
  label: string
  placeholder: string
  options: NetworkNode[]
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger aria-label={label}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {TYPE_LABEL[n.type]} · {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function CableNumberField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<CableFormValues>
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
