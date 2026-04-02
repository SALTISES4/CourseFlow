/**
 * Side-effect: configure the Hey API fetch client singleton (`client`) used by
 * `sdk.gen.ts`. Import this once at app startup before any generated SDK call.
 *
 * - `baseUrl`: same origin vs `VITE_API_BASE_URL` as documented in `apiBaseUrl.ts`
 * - `auth`: Bearer token from `authToken` (single source with `getAuthFetchHeaders`)
 */
import { getApiBaseUrl } from './apiBaseUrl'
import { getAccessToken } from './authToken'
import { client } from './gen/client.gen'

client.setConfig({
  baseUrl: getApiBaseUrl(),
  auth: () => getAccessToken() ?? undefined
})
