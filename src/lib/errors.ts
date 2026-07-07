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
  return 'An unexpected error occurred'
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
