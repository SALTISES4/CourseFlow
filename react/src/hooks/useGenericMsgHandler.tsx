import { enqueueSnackbar } from 'notistack'

interface ResponseWithMessage {
  message?: string
}

interface ErrorWithMessage {
  message?: string
}

const useGenericQueryMsgHandler = () => {
  function onSuccess<TResp extends ResponseWithMessage, TCallback>(
    resp: TResp,
    callback?: TCallback
  ) {
    if (resp.message) {
      enqueueSnackbar(resp.message, {
        variant: 'success'
      })
    } else {
      enqueueSnackbar('Success', {
        variant: 'success'
      })
    }

    callback && callback
  }

  function onError<TError extends ErrorWithMessage, TCallback>(
    error: TError,
    callback?: TCallback
  ) {
    if (error.message) {
      enqueueSnackbar(error.message, {
        variant: 'error'
      })
    } else {
      enqueueSnackbar(' An error ocurred', {
        variant: 'error'
      })
    }

    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('Error creating project:', error)
    // setErrors(error.name)
    callback && callback
  }

  return {
    onSuccess,
    onError
  }
}

export default useGenericQueryMsgHandler
