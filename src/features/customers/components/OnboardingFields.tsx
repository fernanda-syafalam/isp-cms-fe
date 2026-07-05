import type { FieldPath, UseFormReturn } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCoverageList } from '@/features/coverage/hooks/useCoverage'
import { useOdpList } from '@/features/ftth/hooks/useOdp'
import type { OnboardingInput } from '@/schemas/onboarding'

// Shared form handle for every onboarding step + field helper.
export type OnboardingForm = UseFormReturn<OnboardingInput>

type FieldProps = {
  form: OnboardingForm
  name: FieldPath<OnboardingInput>
  label: string
  placeholder?: string
}

export function TextField({ form, name, label, placeholder }: FieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              autoComplete="off"
              {...field}
              value={String(field.value ?? '')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SelectField({
  form,
  name,
  label,
  placeholder,
  options,
  disabled = false,
  hint,
}: FieldProps & {
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  hint?: string | undefined
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={String(field.value ?? '')}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full" aria-label={label}>
                <SelectValue placeholder={placeholder} />
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
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}

// UU-PDP data-processing consent — a labelled checkbox bound to `consent`.
export function ConsentField({ form }: { form: OnboardingForm }) {
  return (
    <FormField
      control={form.control}
      name="consent"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-3">
          <FormControl>
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-label="Persetujuan pemrosesan data pribadi"
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="font-normal text-sm">
              Pelanggan menyetujui pemrosesan data pribadi sesuai UU Perlindungan Data Pribadi (UU
              PDP) untuk keperluan layanan dan penagihan.
            </FormLabel>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

// FTTH distribution-point picker. Lists ODPs (optionally filtered to the chosen
// area) with their free/total ports; full ODPs are disabled so they can't be
// picked (the backend also reserves the port atomically and 409s if full).
export function OdpSelectField({ form, areaName }: { form: OnboardingForm; areaName: string }) {
  const odpQuery = useOdpList()
  const all = odpQuery.data?.items ?? []
  const items = areaName ? all.filter((odp) => odp.area === areaName) : all
  const hasAvailable = items.some((odp) => odp.totalPorts - odp.usedPorts > 0)

  return (
    <FormField
      control={form.control}
      name="odpId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>ODP (titik distribusi FTTH)</FormLabel>
          <Select
            value={String(field.value ?? '')}
            onValueChange={field.onChange}
            disabled={odpQuery.isLoading || odpQuery.isError}
          >
            <FormControl>
              <SelectTrigger className="w-full" aria-label="ODP">
                <SelectValue placeholder={odpQuery.isLoading ? 'Memuat ODP…' : 'Pilih ODP'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {items.map((odp) => {
                const free = odp.totalPorts - odp.usedPorts
                const isFull = free <= 0
                return (
                  <SelectItem key={odp.id} value={odp.id} disabled={isFull}>
                    {`${odp.name} · ${free}/${odp.totalPorts} tersedia${isFull ? ' (penuh)' : ''}`}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {odpQuery.isError ? (
            <p className="text-destructive text-xs">Gagal memuat ODP. Coba lagi.</p>
          ) : null}
          {!odpQuery.isLoading && !odpQuery.isError && items.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Belum ada ODP di area ini. Tambah kapasitas dulu di menu FTTH.
            </p>
          ) : null}
          {!odpQuery.isLoading && items.length > 0 && !hasAvailable ? (
            <p className="text-amber-600 text-xs dark:text-amber-500">
              Semua ODP di area ini penuh. Pilih area lain atau tambah kapasitas.
            </p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Friendly pre-warning about area serviceability. The backend is the source of
// truth (it hard-blocks a `down` area with 422); this only nudges the operator.
export function ServiceabilityHint({ areaName }: { areaName: string }) {
  const coverageQuery = useCoverageList()
  if (!areaName) return null
  const area = coverageQuery.data?.items.find(
    (c) => c.name === areaName || c.name.endsWith(` ${areaName}`),
  )
  if (!area) return null

  if (area.status === 'down') {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs"
      >
        Area ini belum terjangkau layanan (status nonaktif). Pengajuan kemungkinan besar akan
        ditolak sistem — pastikan coverage sudah aktif.
      </p>
    )
  }
  if (area.status === 'maintenance') {
    return (
      <p
        role="status"
        className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 text-xs dark:text-amber-400"
      >
        Area ini sedang pemeliharaan. Instalasi mungkin tertunda.
      </p>
    )
  }
  return null
}
