import { lazy, Suspense } from 'react'

import { ErrorState } from '@/components/shared/error-state'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { usePlanOptions } from '@/hooks/usePlanOptions'
import { SERVICE_AREAS } from '@/lib/areas'
import type { OnboardingInput } from '@/schemas/onboarding'

import { type OnboardingForm, SelectField, Summary, TextField } from './OnboardingFields'

// Code-split the Leaflet map picker so it (and Leaflet) stays out of the main
// bundle — loaded only when the onboarding wizard renders.
const LocationPicker = lazy(() =>
  import('@/components/shared/location-picker').then((m) => ({
    default: m.LocationPicker,
  })),
)

const AREAS = SERVICE_AREAS
const TECHNICIANS = ['Teknisi Budi', 'Teknisi Sari', 'Teknisi Joko']

// Step 0: identity, area, and the map pin for the install location.
export function CustomerStep({ form }: { form: OnboardingForm }) {
  const latValue = form.watch('lat')
  const lngValue = form.watch('lng')

  return (
    <>
      <TextField form={form} name="fullName" label="Nama" placeholder="Budi Santoso" />
      <TextField form={form} name="phone" label="Telepon" placeholder="0812xxxxxxx" />
      <TextField form={form} name="email" label="Email (opsional)" placeholder="budi@example.com" />
      <TextField
        form={form}
        name="address"
        label="Alamat"
        placeholder="Jl. Pemuda No. 12, Jepara"
      />
      <SelectField
        form={form}
        name="areaName"
        label="Area"
        placeholder="Pilih area"
        options={AREAS.map((a) => ({ value: a, label: a }))}
      />
      <FormItem>
        <FormLabel>Titik lokasi instalasi</FormLabel>
        <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-muted" />}>
          <LocationPicker
            value={latValue != null && lngValue != null ? { lat: latValue, lng: lngValue } : null}
            onChange={(lat, lng) => {
              form.setValue('lat', lat)
              form.setValue('lng', lng)
            }}
          />
        </Suspense>
        <p className="text-muted-foreground text-xs">
          Tandai titik di peta (seperti memilih lokasi di Shopee) — akan muncul di topologi.
        </p>
      </FormItem>
    </>
  )
}

// Step 1: package picker, with the plan query's loading/error/empty states.
export function PlanStep({
  form,
  planQuery,
}: {
  form: OnboardingForm
  planQuery: ReturnType<typeof usePlanOptions>
}) {
  const planOptions = planQuery.data

  if (planQuery.isError) {
    return (
      <ErrorState
        title="Gagal memuat paket"
        description="Daftar paket tidak bisa diambil. Coba lagi."
        onRetry={() => planQuery.refetch()}
      />
    )
  }

  return (
    <SelectField
      form={form}
      name="planId"
      label="Paket"
      placeholder={planQuery.isLoading ? 'Memuat paket…' : 'Pilih paket'}
      options={planOptions ?? []}
      disabled={planQuery.isLoading}
      hint={
        !planQuery.isLoading && (planOptions?.length ?? 0) === 0
          ? 'Belum ada paket aktif. Buat paket dulu di menu Paket.'
          : undefined
      }
    />
  )
}

// Step 2: technician, schedule date, and an optional survey note.
export function ScheduleStep({ form }: { form: OnboardingForm }) {
  return (
    <>
      <SelectField
        form={form}
        name="technician"
        label="Teknisi"
        placeholder="Pilih teknisi"
        options={TECHNICIANS.map((t) => ({ value: t, label: t }))}
      />
      <FormField
        control={form.control}
        name="scheduledAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jadwal instalasi</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan survey (opsional)</FormLabel>
            <FormControl>
              <Textarea placeholder="Hasil survey, titik tarikan, dll." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// Step 3: read-only review of everything captured before submit.
export function SummaryStep({ values, planLabel }: { values: OnboardingInput; planLabel: string }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <Summary label="Nama" value={values.fullName} />
      <Summary label="Telepon" value={values.phone} />
      <Summary label="Email" value={values.email || '—'} />
      <Summary label="Alamat" value={values.address} />
      <Summary label="Area" value={values.areaName} />
      <Summary label="Paket" value={planLabel} />
      <Summary label="Teknisi" value={values.technician} />
      <Summary label="Jadwal instalasi" value={values.scheduledAt} />
    </dl>
  )
}
