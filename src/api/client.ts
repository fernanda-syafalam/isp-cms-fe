import type { HTTPError } from 'ky';
import ky from 'ky'

import { AppError } from '@/lib/errors'

const baseURL = import.meta.env['VITE_API_BASE_URL'] ?? '/api'

export const api = ky.create({
  prefixUrl: baseURL,
  timeout: 15_000,
  retry: { limit: 1, methods: ['get'] },
  hooks: {
    beforeError: [
      async (error: HTTPError) => {
        const { response } = error
        let message = error.message
        try {
          const body = (await response.json()) as { message?: string }
          if (body?.message) message = body.message
        } catch {
          // body is not JSON — keep default message
        }
        throw new AppError('HTTP_ERROR', message, error)
      },
    ],
  },
})
