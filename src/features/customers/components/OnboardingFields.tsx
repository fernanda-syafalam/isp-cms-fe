import type { FieldPath, UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
            <Input placeholder={placeholder} autoComplete="off" {...field} />
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
