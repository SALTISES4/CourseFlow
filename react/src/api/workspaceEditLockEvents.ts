import type { ExpectedApiErrorBody } from './apiError'

export const WORKSPACE_EDIT_LOCK_ERROR_EVENT =
  'courseflow:workspace-edit-lock-error'

export type WorkspaceEditLockErrorDetail = {
  code: 'edit_lock_expired' | 'workspace_edit_lock_conflict'
  workspace: 'project' | 'workflow'
  resourceUuid: string
  holderDisplayName?: string
  holderUuid?: string
  version?: string
}

export function getWorkspaceEditLockErrorDetail(
  body: ExpectedApiErrorBody | null
): WorkspaceEditLockErrorDetail | null {
  if (
    !body ||
    !['edit_lock_expired', 'workspace_edit_lock_conflict'].includes(body.code)
  ) {
    return null
  }

  const workspace = body.params?.workspace
  const resourceUuid = body.params?.resourceUuid
  if (
    (workspace !== 'project' && workspace !== 'workflow') ||
    typeof resourceUuid !== 'string'
  ) {
    return null
  }

  return {
    code: body.code as WorkspaceEditLockErrorDetail['code'],
    workspace,
    resourceUuid,
    holderDisplayName:
      typeof body.params?.holderDisplayName === 'string'
        ? body.params.holderDisplayName
        : undefined,
    holderUuid:
      typeof body.params?.holderUuid === 'string'
        ? body.params.holderUuid
        : undefined,
    version:
      typeof body.params?.version === 'string' ? body.params.version : undefined
  }
}

export function publishWorkspaceEditLockError(
  detail: WorkspaceEditLockErrorDetail
): void {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(
    new CustomEvent<WorkspaceEditLockErrorDetail>(
      WORKSPACE_EDIT_LOCK_ERROR_EVENT,
      { detail }
    )
  )
}
