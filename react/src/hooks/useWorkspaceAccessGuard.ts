import { getApiErrorStatus, isArchivedApiError } from '@cf/api/apiError'
import {
  WORKSPACE_ACCESS_RECHECK_EVENT,
  WorkspaceAccessRecheckDetail
} from '@cf/api/workspaceAccessEvents'
import { enqueueSnackbar } from 'notistack'
import { useCallback, useEffect, useRef, useState } from 'react'

type Workspace = 'project' | 'workflow'

type UseWorkspaceAccessGuardOptions = {
  workspace: Workspace
  resourceUuid: string | undefined
  resourceRole: string | null | undefined
  hasSuccessfulLoad: boolean
  directError: unknown
  routePathname: string
  revalidate: () => Promise<unknown | null>
}

/**
 * Revalidate the current workspace after any in-workspace 403. This separates
 * an action-level denial from an actual access transition and preserves the
 * documented stale workspace for contributor removal/archive events.
 */
export function useWorkspaceAccessGuard({
  workspace,
  resourceUuid,
  resourceRole,
  hasSuccessfulLoad,
  directError,
  routePathname,
  revalidate
}: UseWorkspaceAccessGuardOptions) {
  const [revokedResourceUuid, setRevokedResourceUuid] = useState<string>()
  const roleRef = useRef(resourceRole)
  const recheckingRef = useRef(false)
  const handledErrorRef = useRef<unknown>(null)
  const previousRouteRef = useRef(routePathname)

  roleRef.current = resourceRole

  useEffect(() => {
    handledErrorRef.current = null
  }, [resourceUuid])

  const applyRestriction = useCallback(
    (error: unknown) => {
      if (getApiErrorStatus(error) !== 403) {
        return
      }
      if (isArchivedApiError(error)) {
        enqueueSnackbar(`this ${workspace} has been archived`, {
          variant: 'error'
        })
        return
      }
      if (roleRef.current === 'public') {
        setRevokedResourceUuid(resourceUuid)
        return
      }
      enqueueSnackbar(`you do not have access to this ${workspace}`, {
        variant: 'error'
      })
    },
    [resourceUuid, workspace]
  )

  const recheck = useCallback(async () => {
    if (recheckingRef.current) {
      return
    }
    recheckingRef.current = true
    try {
      const error = await revalidate()
      if (error) {
        handledErrorRef.current = error
        applyRestriction(error)
      }
    } finally {
      recheckingRef.current = false
    }
  }, [applyRestriction, revalidate])

  useEffect(() => {
    if (!hasSuccessfulLoad || !resourceUuid) {
      return
    }
    const resourcePath = `/api/${workspace}/${resourceUuid}`
    const onAccessRecheck = (event: Event) => {
      const { method, pathname } = (
        event as CustomEvent<WorkspaceAccessRecheckDetail>
      ).detail
      if (method === 'GET' && pathname === resourcePath) {
        return
      }
      void recheck()
    }
    window.addEventListener(WORKSPACE_ACCESS_RECHECK_EVENT, onAccessRecheck)
    return () => {
      window.removeEventListener(
        WORKSPACE_ACCESS_RECHECK_EVENT,
        onAccessRecheck
      )
    }
  }, [hasSuccessfulLoad, recheck, resourceUuid, workspace])

  useEffect(() => {
    if (
      !hasSuccessfulLoad ||
      getApiErrorStatus(directError) !== 403 ||
      handledErrorRef.current === directError
    ) {
      return
    }
    handledErrorRef.current = directError
    applyRestriction(directError)
  }, [applyRestriction, directError, hasSuccessfulLoad])

  useEffect(() => {
    if (previousRouteRef.current === routePathname) {
      return
    }
    previousRouteRef.current = routePathname
    if (hasSuccessfulLoad) {
      void recheck()
    }
  }, [hasSuccessfulLoad, recheck, routePathname])

  return { privateAccessRevoked: revokedResourceUuid === resourceUuid }
}
