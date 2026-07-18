import { SnackbarOptions } from '@cf/utility/constants'
import { enqueueSnackbar } from 'notistack'

const PrettyPrintJSON = ({ error }: { error: string | object }) => {
  return (
    <>
      ERROR!
      <pre>
        <code>{JSON.stringify(error, null, 2)}</code>
      </pre>
    </>
  )
}

const useGenericQueryMsgHandler = () => {
  function onSuccess(resp: unknown, callback?: () => void) {
    const msg =
      typeof resp === 'object' &&
      resp !== null &&
      'message' in resp &&
      typeof resp.message === 'string'
        ? resp.message
        : 'Success!'

    enqueueSnackbar(msg, {
      variant: SnackbarOptions.SUCCESS
    })
    callback?.()
  }

  function onError(error: unknown) {
    let msg: string | object = 'An error occurred!'

    if (error instanceof Error || typeof error === 'string') {
      msg = error instanceof Error ? error.message : error
    } else if (typeof error === 'object' && error !== null) {
      msg =
        'message' in error && typeof error.message === 'string'
          ? error.message
          : error
    }

    enqueueSnackbar(
      typeof msg === 'string' ? msg : <PrettyPrintJSON error={msg} />,
      {
        variant: SnackbarOptions.ERROR
      }
    )

    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('error from useGenericQueryMsgHandler:onError ', error)
  }

  return {
    onSuccess,
    onError
  }
}

export default useGenericQueryMsgHandler
