import { SnackbarOptions } from '@cf/constants'
import { enqueueSnackbar } from 'notistack'
import * as React from 'react'

interface ResponseWithMessage {
  message?: string
}

interface ErrorWithMessage {
  message?: string
}

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
  function onSuccess<TResp extends ResponseWithMessage, TCallback>(
    resp: TResp,
    callback?: TCallback
  ) {
    const msg = resp.message ?? 'Success!'

    enqueueSnackbar(msg, {
      variant: SnackbarOptions.SUCCESS
    })
    callback && callback
  }

  function onError<TError extends ErrorWithMessage, TCallback>(
    error: TError,
    callback?: TCallback
  ) {
    const msg = error ?? 'An error occurred!'
    enqueueSnackbar(<PrettyPrintJSON error={msg} />, {
      variant: SnackbarOptions.ERROR
    })

    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('error from useGenericQueryMsgHandler:onError ', error)
    // setErrors(error.name)
    callback && callback
  }

  return {
    onSuccess,
    onError
  }
}

export default useGenericQueryMsgHandler
