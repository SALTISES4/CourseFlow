/**
 * Side-effect: configure the Hey API fetch client singleton (`client`) used by
 * `sdk.gen.ts`. Import this once at app startup before any generated SDK call.
 *
 * - `baseUrl`: same origin vs `VITE_API_BASE_URL` as documented in `apiBaseUrl.ts`
 * - `auth`: Bearer token from `authToken` (single source with `getAuthFetchHeaders`)
 */
import { getApiBaseUrl } from './apiBaseUrl'
import { CourseFlowApiError } from './apiError'
import { getAccessToken } from './authToken'
import { client } from './gen/client.gen'
import { requestWorkspaceAccessRecheck } from './workspaceAccessEvents'

client.setConfig({
  baseUrl: getApiBaseUrl(),
  auth: () => getAccessToken() ?? undefined
})

client.interceptors.error.use((error, response, request) => {
  if (response?.status === 403) {
    requestWorkspaceAccessRecheck(request)
  }
  return error instanceof CourseFlowApiError
    ? error
    : new CourseFlowApiError(response?.status, error)
})
