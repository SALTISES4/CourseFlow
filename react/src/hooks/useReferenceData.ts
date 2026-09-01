import { getReferenceDataOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { useQuery } from '@tanstack/react-query'

export const useReferenceData = () =>
  useQuery({
    ...getReferenceDataOptions(),
    staleTime: Infinity
  })
