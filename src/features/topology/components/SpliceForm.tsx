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
import type { Cable } from '@/schemas/cable'
import type { CreateSpliceInput, SpliceType } from '@/schemas/closure'

const SPLICE_TYPE_LABEL: Record<SpliceType, string> = {
  fusion: 'Fusion',
  mechanical: 'Mekanis',
  passthrough: 'Pass-through',
}

const CABLE_KIND_LABEL: Record<string, string> = {
  feeder: 'Feeder',
  distribution: 'Distribusi',
  drop: 'Drop',
}

type SpliceFormApi = UseFormReturn<CreateSpliceInput>

type Props = {
  form: SpliceFormApi
  cables: Cable[]
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}

export function SpliceForm({ form, cables, onSubmit, onCancel }: Props) {
  const submitting = form.formState.isSubmitting
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CableSelectField form={form} name="inCableId" label="Kabel masuk" cables={cables} />
          <NumberField form={form} name="inTubeNo" label="Tube masuk" min={1} />
          <NumberField form={form} name="inCoreNo" label="Core masuk" min={1} max={12} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CableSelectField form={form} name="outCableId" label="Kabel keluar" cables={cables} />
          <NumberField form={form} name="outTubeNo" label="Tube keluar" min={1} />
          <NumberField form={form} name="outCoreNo" label="Core keluar" min={1} max={12} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Jenis sambungan">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(SPLICE_TYPE_LABEL) as SpliceType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {SPLICE_TYPE_LABEL[t]}
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
            name="lossDb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loss (dB)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
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

function CableSelectField({
  form,
  name,
  label,
  cables,
}: {
  form: SpliceFormApi
  name: 'inCableId' | 'outCableId'
  label: string
  cables: Cable[]
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger aria-label={label}>
                <SelectValue placeholder="Pilih kabel" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {cables.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {CABLE_KIND_LABEL[c.kind] ?? c.kind} · {c.spec}
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

// Small reusable number field for the tube/core integer inputs.
function NumberField({
  form,
  name,
  label,
  min,
  max,
}: {
  form: SpliceFormApi
  name: 'inTubeNo' | 'inCoreNo' | 'outTubeNo' | 'outCoreNo'
  label: string
  min: number
  max?: number
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
              min={min}
              {...(max ? { max } : {})}
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
