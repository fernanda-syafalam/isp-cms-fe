import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useResellersList } from '../hooks/useResellers'

// Sentinel for the "no reseller" choice — Radix Select forbids an empty-string
// item value, so the none option maps to `null` on the form field.
const NONE_VALUE = '__none__'

type ResellerSelectFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label?: string
}

// RHF-connected reseller/mitra picker for referral attribution (P3.D.2), backed
// by useResellersList. The field is optional: a "— Tanpa reseller —" option maps
// to `null`. Loading / error / empty states mirror PlanSelectField.
export function ResellerSelectField<T extends FieldValues>({
  control,
  name,
  label = 'Mitra/Reseller',
}: ResellerSelectFieldProps<T>) {
  const resellersQuery = useResellersList()
  const options = resellersQuery.data?.items ?? []
  const noResellers = !resellersQuery.isLoading && !resellersQuery.isError && options.length === 0

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value == null || field.value === '' ? NONE_VALUE : String(field.value)}
            disabled={resellersQuery.isLoading || resellersQuery.isError}
            onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
          >
            <FormControl>
              <SelectTrigger className="w-full" aria-label={label}>
                <SelectValue
                  placeholder={resellersQuery.isLoading ? 'Memuat…' : 'Pilih mitra/reseller'}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Tanpa reseller —</SelectItem>
              {options.map((reseller) => (
                <SelectItem key={reseller.id} value={reseller.id}>
                  {reseller.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {resellersQuery.isError ? (
            <button
              type="button"
              onClick={() => resellersQuery.refetch()}
              className="justify-self-start text-destructive text-xs underline-offset-2 hover:underline"
            >
              Gagal memuat reseller. Coba lagi.
            </button>
          ) : noResellers ? (
            <p className="text-muted-foreground text-xs">Belum ada mitra/reseller.</p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
