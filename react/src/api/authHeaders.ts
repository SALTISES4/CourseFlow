import { getAccessToken } from '@cf/api/authToken'

/**
 * Headers for manual `fetch` (graph commands, legacy XMLHTTP) — JSON + optional Bearer.
 * The Hey API client uses the same token via `configureCourseFlowClient` + `client.setConfig({ auth })`.
 */
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
