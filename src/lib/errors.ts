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
