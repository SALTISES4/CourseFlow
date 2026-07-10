import { LibrarySearchIn } from '@cf/api/gen'

export function buildLibrarySearchRequestBody(
  args: LibrarySearchIn
): Record<string, unknown> {
  const pagination = args.pagination ?? { page: 0 }
  const sort = args.sort ?? undefined
  const filters = args.filters ?? undefined

  const body: Record<string, unknown> = {
    pagination: {
      page: pagination.page ?? 0,
      results_per_page: pagination.resultsPerPage ?? 10
    }
  }
  if (sort) {
    body.sort = {
      value: sort.value,
      direction: sort.direction
    }
  }
  if (filters) {
    body.filters = filters
  }
  return body
}
