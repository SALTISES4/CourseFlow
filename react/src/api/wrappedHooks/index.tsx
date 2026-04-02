import { LibrarySearchIn, searchLibrary } from '@cf/api/gen'
import { useQuery } from '@tanstack/react-query'

// export type FilterResult = {
//   name: string
//   value: string | boolean | number | string[] | number[]
// }[]

// export type LibraryObjectsSearchQueryArgs = {
//   pagination?: {
//     page: number
//     resultsPerPage?: number
//   }
//   sort?: {
//     direction: SortDirection
//     value: SortValueOption
//   } | null
//   filters?: FilterResult
// }

export function useLibrarySearch(input: LibrarySearchIn) {
  return useQuery({
    queryKey: ['library-search', input],
    queryFn: async () => {
      const { data } = await searchLibrary({
        body: input,
        throwOnError: true
      })
      return data
    }
  })
}
