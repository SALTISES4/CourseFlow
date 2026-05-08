import { searchLibrary } from '@cf/api/gen'
import { QueryKey, useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { Draft, produce } from 'immer'

export function useLibrarySearch(input: Record<string, unknown>) {
  return useQuery({
    queryKey: ['library-search', input],
    queryFn: async () => {
      const { data } = await searchLibrary({
        body: input as never,
        throwOnError: true
      })
      return data
    }
  })
}

/**
 * Used to patch react query caches on a more granular level
 * wihtout triggering auto-refresh by invalidating cached query keys.
 * Useful when a bool toggles somewhere, or for granular field updates, etc.
 */
export function usePatchQueryCache() {
  const client = useQueryClient()

  return function queryCachePatcher<T>({
    queryKey,
    callback
  }: {
    queryKey: QueryKey
    callback: (draft: Draft<T>) => void
  }) {
    client.getQueriesData<T>({ queryKey }).forEach(([queryKey, oldData]) => {
      if (!oldData) {
        return
      }
      client.setQueryData(queryKey, produce(oldData, callback))
    })
  }
}
