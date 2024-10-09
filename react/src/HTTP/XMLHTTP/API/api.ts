// Import necessary functions from Redux Toolkit
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/*******************************************************
 *
 * https://redux-toolkit.js.org/rtk-query/usage/queries
 *
 *
 * data - The latest returned result regardless of hook arg, if present.
 * currentData - The latest returned result for the current hook arg, if present.
 * error - The error result if present.
 * isUninitialized - When true, indicates that the query has not started yet.
 * isLoading - When true, indicates that the query is currently loading for the first time, and has no data yet. This will be true for the first request fired off, but not for subsequent requests.
 * isFetching - When true, indicates that the query is currently fetching, but might have data from an earlier request. This will be true for both the first request fired off, as well as subsequent requests.
 * isSuccess - When true, indicates that the query has data from a successful request.
 * isError - When true, indicates that the query is in an error state.
 * refetch - A function to force refetch the query
 *
 *
 *
 * skip - Allows a query to 'skip' running for that render. Defaults to false
 * pollingInterval - Allows a query to automatically refetch on a provided interval, specified in milliseconds. Defaults to 0 (off)
 * selectFromResult - Allows altering the returned value of the hook to obtain a subset of the result, render-optimized for the returned subset.
 * refetchOnMountOrArgChange - Allows forcing the query to always refetch on mount (when true is provided). Allows forcing the query to refetch if enough time (in seconds) has passed since the last query for the same cache (when a number is provided). Defaults to false
 * refetchOnFocus - Allows forcing the query to refetch when the browser window regains focus. Defaults to false
 * refetchOnReconnect - Allows forcing the query to refetch when regaining a network connection. Defaults to false
 *******************************************************/

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

export enum Verb {
  POST = 'POST',
  GET = 'GET',
  PATCH = 'PATCH'
}

type ApiError = FetchBaseQueryError | HttpError | SerializedError

export function getErrorMessage(error: ApiError): string {
  if ('status' in error && typeof error.status === 'number') {
    // HTTP errors
    return `Server error: ${error.status}`
  } else if ('error' in error) {
    // FetchBaseQuery errors
    return `Error: ${error.error}`
  } else if ('message' in error) {
    // Serialized or standard JS errors
    return `Error: ${error.message}`
  }
  return 'An unknown error occurred'
}

const apiPathBase = '/'
// Define the base query with necessary headers and configurations
const baseQuery = fetchBaseQuery({
  baseUrl: apiPathBase,
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json')
    // Ensure your CSRF token setup is handled here
    headers.set('X-CSRFToken', window.getCsrfToken())
    return headers
  }
})

export const cfApi = createApi({
  baseQuery: baseQuery,
  endpoints: () => ({})
})
