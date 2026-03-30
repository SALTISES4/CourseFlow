import { getAccessToken } from '@cf/api/authToken'

/** Headers for fetch/RTK that include JSON + optional Bearer token. */
export function getAuthFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}
