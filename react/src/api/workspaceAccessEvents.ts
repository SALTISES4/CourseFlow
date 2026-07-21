export const WORKSPACE_ACCESS_RECHECK_EVENT =
  'courseflow:workspace-access-recheck'

export type WorkspaceAccessRecheckDetail = {
  method: string
  pathname: string
}

export function requestWorkspaceAccessRecheck(request: Request): void {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(
    new CustomEvent<WorkspaceAccessRecheckDetail>(
      WORKSPACE_ACCESS_RECHECK_EVENT,
      {
        detail: {
          method: request.method,
          pathname: new URL(request.url, window.location.origin).pathname
        }
      }
    )
  )
}
