import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client for generated `*Options` / hooks under `src/api`.
 */
export const courseFlowQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60
    }
  }
})

// Add support for TanStack Query devtools
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import('@tanstack/query-core').QueryClient
  }
}

window.__TANSTACK_QUERY_CLIENT__ = courseFlowQueryClient
