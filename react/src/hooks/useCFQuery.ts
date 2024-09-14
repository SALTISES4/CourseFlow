// @ts-nocheck
import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'

interface UseCustomQueryOptions<TData, TError, TQueryKey extends QueryKey>
  extends UseQueryOptions<TData, TError, TData> {
  queryKey: TQueryKey
  queryFn: (context: { signal: AbortSignal }) => Promise<TData>
}

/**
 * const { data, error, isLoading } = useCustomQuery<SomeDataType, Error, ['someQueryKey']>({
 *   queryFn: async () => {
 *     // Your API call logic here
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Network response was not ok');
 *     return response.json();
 *   },
 *   onSuccess: (data) => {
 *     console.log('Data:', data);
 *   },
 *   onError: (error) => {
 *     console.error('Failed to fetch data:', error);
 *   }
 * });
 */

function useCustomQuery<TData, TError, TQueryKey extends QueryKey>(
  options: UseCustomQueryOptions<TData, TError, TQueryKey>
) {
  const { queryFn, onSuccess, onError } = options

  return useQuery<TData, TError, TData, TQueryKey>({
    ...options,
    queryFn,
    onSuccess: (data) => {
      enqueueSnackbar('Data fetched successfully', { variant: 'success' })
      onSuccess?.(data)
    },
    onError: (error) => {
      enqueueSnackbar('Error fetching data', { variant: 'error' })
      onError?.(error)
    }
  })
}
