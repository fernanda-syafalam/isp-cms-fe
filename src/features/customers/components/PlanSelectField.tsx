import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePlanOptions } from '@/hooks/usePlanOptions'

type PlanSelectFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label?: string
}

// RHF-connected package picker backed by usePlanOptions, with built-in
// loading / error / empty affordances so every plan dropdown in the customer
// forms behaves the same: a disabled "Memuat paket…" select while plans load,
// an inline retry on failure, and a hint when there are no active plans.
export function PlanSelectField<T extends FieldValues>({
  control,
  name,
  label = 'Paket',
}: PlanSelectFieldProps<T>) {
  const plansQuery = usePlanOptions()
  const options = plansQuery.data ?? []
  const noPlans = !plansQuery.isLoading && !plansQuery.isError && options.length === 0

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={String(field.value ?? '')}
            disabled={plansQuery.isLoading || plansQuery.isError}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className="w-full" aria-label={label}>
                <SelectValue
                  placeholder={
                    plansQuery.isLoading
                      ? 'Memuat paket…'
                      : plansQuery.isError
                        ? 'Gagal memuat paket'
                        : 'Pilih paket'
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {plansQuery.isError ? (
            <button
              type="button"
              onClick={() => plansQuery.refetch()}
              className="justify-self-start text-destructive text-xs underline-offset-2 hover:underline"
            >
              Gagal memuat paket. Coba lagi.
            </button>
          ) : noPlans ? (
            <p className="text-muted-foreground text-xs">Belum ada paket aktif.</p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
