import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define possible error types
interface FetchBaseQueryError {
  // status: 'FETCH_ERROR' | 'PARSING_ERROR'
  status: any
  data?: unknown
  error: string
}

interface HttpError {
  status: number
  data: unknown
}

interface SerializedError {
  name?: string
  message?: string
  stack?: string
}

type ApiError = FetchBaseQueryError | HttpError | SerializedError

export function getErrorMessage(error: ApiError): string {
  if ('status' in error && typeof error.status === 'number') {
    return `Server error: ${error.status}`
  }

  if ('error' in error) {
    return `Error: ${error.error}`
  }
  if ('message' in error) {
    return `Error: ${error.message}`
  }
  return 'An unknown error occurred'
}
