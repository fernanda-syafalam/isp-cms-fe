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
import { type NetworkNode, type NodeType, NodeStatusSchema } from '@/schemas/topology'

import { TYPE_LABEL } from '../lib/graph'
import { NO_PARENT, type NodeFormValues } from './nodeFormSchema'
import { NodeMetaFields } from './NodeMetaFields'

const STATUSES = NodeStatusSchema.options

type Props = {
  form: UseFormReturn<NodeFormValues>
  types: NodeType[]
  parentOptions: NetworkNode[]
  isEdit: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}

export function NodeForm({ form, types, parentOptions, isEdit, onSubmit, onCancel }: Props) {
  const watchedType = form.watch('type')
  const submitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
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
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full" aria-label="Tipe">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full" aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <NodeMetaFields form={form} type={watchedType} />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uplink (induk)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full" aria-label="Uplink">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>Tidak ada (root / OLT)</SelectItem>
                  {parentOptions.map((n) => (
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

        <div className="grid grid-cols-2 gap-3">
          <CoordField form={form} name="lat" label="Lat" />
          <CoordField form={form} name="lng" label="Lng" />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function CoordField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<NodeFormValues>
  name: 'lat' | 'lng'
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
              step="any"
              {...field}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
