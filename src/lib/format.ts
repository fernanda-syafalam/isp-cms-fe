// Locale-aware formatting helpers. Currency is IDR and numbers/dates use the
// id-ID locale (per the ISP CMS context); UI label text stays English.

const LOCALE = 'id-ID'

const idrFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat(LOCALE)

const idrCompactFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'IDR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Format a number of rupiah as `Rp1.250.000`. */
export function formatCurrency(amount: number): string {
  return idrFormatter.format(amount)
}

/** Format a plain number with id-ID grouping, e.g. `1.250`. */
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** Compact rupiah for axes/labels, e.g. `Rp62 jt`. */
export function formatCurrencyCompact(amount: number): string {
  return idrCompactFormatter.format(amount)
}

/** Format an ISO date string (or Date) as a medium id-ID date. */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** Format an ISO date string (or Date) as a medium date + short time. */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** Format a 0..1 ratio as a whole-number percent, e.g. `0.124 -> "12%"`. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}
