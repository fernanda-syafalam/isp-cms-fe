import { api } from './client'

// Dev-only: reset the stateful mock store back to its seed (mock-first phase).
export async function resetMockData(): Promise<void> {
  await api.post('_dev/reset')
}
