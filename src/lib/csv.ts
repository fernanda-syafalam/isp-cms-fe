// Minimal CSV export — turns an array of records into a downloadable file.
// Values are stringified and quote-escaped; headers come from the first row
// (or an explicit column list).

function escapeCell(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  if (rows.length === 0) return ''
  const keys = columns ?? Object.keys(rows[0] as Record<string, unknown>)
  const header = keys.map(escapeCell).join(',')
  const body = rows.map((row) => keys.map((k) => escapeCell(row[k])).join(',')).join('\n')
  return `${header}\n${body}`
}

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, unknown>>,
  columns?: string[],
): void {
  const csv = toCsv(rows, columns)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
