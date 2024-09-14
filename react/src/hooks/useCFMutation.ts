import { UseMutationOptions, useMutation } from '@tanstack/react-query' // assuming you're using notistack or similar for snackbars
import { enqueueSnackbar } from 'notistack'

type MutationFunction<TData, TError, TVariables> = (
  variables: TVariables
) => Promise<TData>

interface UseCustomMutationOptions<TData, TError, TVariables>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  mutationFn: MutationFunction<TData, TError, TVariables>
}

function useCFMutation<TData, TError, TVariables>({
  mutationFn,
  onSuccess,
  onError,
  onSettled,
  ...options
}: UseCustomMutationOptions<TData, TError, TVariables>) {
  return useMutation<TData, TError, TVariables>({
    ...options,
    mutationFn,
    onSuccess: (data, variables, context) => {
      enqueueSnackbar('Operation successful', { variant: 'success' })
      onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      enqueueSnackbar('Operation failed', { variant: 'error' })
      onError?.(error, variables, context)
    },
    onSettled: (data, error, variables, context) => {
      enqueueSnackbar('Operation attempted', { variant: 'info' })
      onSettled?.(data, error, variables, context)
    }
  })
}

export default useCFMutation
