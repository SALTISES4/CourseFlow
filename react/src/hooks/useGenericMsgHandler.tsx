import { SnackbarOptions } from '@cf/utility/constants'
import { enqueueSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

const useGenericQueryMsgHandler = () => {
  const { t } = useTranslation('common')

  function onSuccess(
    resp?: { localizedMessage?: string } | unknown,
    callback?: () => void
  ) {
    const localizedMessage =
      typeof resp === 'object' &&
      resp !== null &&
      'localizedMessage' in resp &&
      typeof resp.localizedMessage === 'string'
        ? resp.localizedMessage
        : undefined

    enqueueSnackbar(localizedMessage ?? t('messages.success'), {
      variant: SnackbarOptions.SUCCESS
    })
    callback?.()
  }

  function onError(error: unknown) {
    const localizedMessage =
      typeof error === 'object' &&
      error !== null &&
      'localizedMessage' in error &&
      typeof error.localizedMessage === 'string'
        ? error.localizedMessage
        : undefined

    enqueueSnackbar(localizedMessage ?? t('errors.unexpected'), {
      variant: SnackbarOptions.ERROR
    })

    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('error from useGenericQueryMsgHandler:onError', error)
  }

  return {
    onSuccess,
    onError
  }
}

export default useGenericQueryMsgHandler
