/**
 * Side-effect: configure the Hey API fetch client singleton (`client`) used by
 * `sdk.gen.ts`. Import this once at app startup before any generated SDK call.
 *
 * - `baseUrl`: same origin vs `VITE_API_BASE_URL` as documented in `apiBaseUrl.ts`
 * - `auth`: Bearer token from `authToken` (single source with `getAuthFetchHeaders`)
 */
import i18n from '@cf/i18n'
import { enqueueSnackbar } from 'notistack'

import { getApiBaseUrl } from './apiBaseUrl'
import { CourseFlowApiError, getApiErrorBody } from './apiError'
import { getAccessToken } from './authToken'
import { client } from './gen/client.gen'
import { requestWorkspaceAccessRecheck } from './workspaceAccessEvents'
import {
  getWorkspaceEditLockErrorDetail,
  publishWorkspaceEditLockError
} from './workspaceEditLockEvents'

client.setConfig({
  baseUrl: getApiBaseUrl(),
  auth: () => getAccessToken() ?? undefined
})

client.interceptors.error.use((error, response, request) => {
  if (response?.status === 403) {
    requestWorkspaceAccessRecheck(request)
  }
  const apiError =
    error instanceof CourseFlowApiError
      ? error
      : new CourseFlowApiError(response?.status, error)
  const editLockError = getWorkspaceEditLockErrorDetail(
    getApiErrorBody(apiError)
  )
  if (editLockError) {
    const message = String(
      editLockError.code === 'edit_lock_expired'
        ? i18n.t('editLock.expired', { ns: 'common' })
        : editLockError.workspace === 'project'
          ? i18n.t('editLock.projectConflict', {
              ns: 'common',
              displayName: editLockError.holderDisplayName ?? ''
            })
          : i18n.t('editLock.workflowConflict', {
              ns: 'common',
              displayName: editLockError.holderDisplayName ?? ''
            })
    )
    apiError.localizedMessage = message
    apiError.notificationHandled = true
    enqueueSnackbar(message, { variant: 'error' })
    publishWorkspaceEditLockError(editLockError)
  }
  return apiError
})
