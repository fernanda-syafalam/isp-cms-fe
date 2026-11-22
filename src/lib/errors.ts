export type ErrorCode = 'HTTP_ERROR' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'UNKNOWN'

export class AppError extends Error {
  public readonly code: ErrorCode

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    if (cause !== undefined) this.cause = cause
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message
  if (err instanceof Error) return err.message
  return 'Terjadi kesalahan tak terduga'
}

/**
 * Reads the machine-readable `code` marker from an RFC 7807 problem+json
 * error body (surfaced by the api client as `AppError.cause`). The backend
 * sets it on branchable failures — e.g. login TOTP challenges emit
 * `totp_required` / `totp_invalid` / `totp_locked` — so callers can react to
 * a stable code instead of parsing a human message. Returns `undefined` when
 * the error carries no such marker.
 */
export function getErrorCode(err: unknown): string | undefined {
  if (err instanceof AppError && typeof err.cause === 'object' && err.cause !== null) {
    const code = (err.cause as { code?: unknown }).code
    if (typeof code === 'string') return code
  }
  return undefined
}

export type FieldErrors = Record<string, string[]>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function fromIssues(issues: unknown[]): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of issues) {
    if (!isRecord(issue) || typeof issue.message !== 'string' || !Array.isArray(issue.path))
      continue
    const key = issue.path.map(String).join('.')
    result[key] = [...(result[key] ?? []), issue.message]
  }
  return result
}

function fromFlatten(flatten: Record<string, unknown>): FieldErrors {
  const { fieldErrors } = flatten
  if (!isRecord(fieldErrors)) return {}
  const result: FieldErrors = {}
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (isStringArray(messages)) result[key] = messages
  }
  return result
}

/**
 * Normalizes the `errors` member of a problem+json body — either a Zod issues
 * array or a flattened `{ formErrors, fieldErrors }` object — to a map of
 * dotted field path to messages.
 */
export function normalizeFieldErrors(errors: unknown): FieldErrors {
  if (Array.isArray(errors)) return fromIssues(errors)
  if (isRecord(errors)) return fromFlatten(errors)
  return {}
}

/** Reads the normalized field errors the api client put on `AppError.cause`. */
export function getFieldErrors(err: unknown): FieldErrors {
  if (!(err instanceof AppError) || !isRecord(err.cause)) return {}
  return fromFlatten(err.cause)
}
