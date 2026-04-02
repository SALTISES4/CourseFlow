import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client for generated `*Options` / hooks under `src/api`.
 */
export const courseFlowQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})
