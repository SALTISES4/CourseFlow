import { getApiErrorStatus, isArchivedApiError } from '@cf/api/apiError'
import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkspacePermissionsProvider } from '@cf/context/workspacePermissionsContext'
import { selectAuthUser } from '@cf/features/auth/state/auth.slice'
import { loadNodeInsertModePreference } from '@cf/features/graph/state/nodeInsertModePreference'
import {
  canRenderShell,
  selectWorkflowLoadState
} from '@cf/features/graph/state/selectors/readiness.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import { useGraphBootstrap } from '@cf/features/graph/state/useGraphBootstrap'
import { useWorkspaceAccessGuard } from '@cf/hooks/useWorkspaceAccessGuard'
import { AppDispatch, RootState } from '@cf/redux/store'
import Loader from '@cfComponents/UIPrimitives/Loader'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import WorkspaceAccessDenied from '@cfPages/MsgViews/WorkspaceAccessDenied'
import WorkflowTabs from '@cfPages/Workflow/WorkflowTabs'
import { WorkflowSidebarContextProvider } from '@cfSidebar/hooks/useSidebar/context'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'

const Workflow = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const location = useLocation()
  const workflowUuid = uuid ?? null
  const dispatch = useDispatch<AppDispatch>()
  const userUuid = useSelector(selectAuthUser)?.uuid
  const {
    data: workflowResponse,
    error,
    isError,
    isPending,
    refetch
  } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid ?? '' } }),
    enabled: Boolean(workflowUuid)
  })
  const lastResourceUuid = useRef(workflowUuid)
  const lastSuccessfulResponse = useRef<typeof workflowResponse>()
  if (lastResourceUuid.current !== workflowUuid) {
    lastResourceUuid.current = workflowUuid
    lastSuccessfulResponse.current = undefined
  }
  if (workflowResponse) {
    lastSuccessfulResponse.current = workflowResponse
  }
  const resolvedWorkflowResponse =
    workflowResponse ?? lastSuccessfulResponse.current
  const revalidate = useCallback(async () => {
    const result = await refetch()
    return result.error ?? null
  }, [refetch])
  const { privateAccessRevoked } = useWorkspaceAccessGuard({
    workspace: 'workflow',
    resourceUuid: workflowUuid ?? undefined,
    resourceRole: resolvedWorkflowResponse?.item.permissions.resourceRole,
    hasSuccessfulLoad: Boolean(lastSuccessfulResponse.current),
    directError: error,
    routePathname: location.pathname,
    revalidate
  })

  useLayoutEffect(() => {
    if (!userUuid || !workflowUuid) {
      return
    }

    dispatch(
      graphUiActions.setNodeInsertMode(
        loadNodeInsertModePreference(userUuid, workflowUuid)
      )
    )
  }, [dispatch, userUuid, workflowUuid])

  useGraphBootstrap(resolvedWorkflowResponse ? workflowUuid : null)

  const shellReady = useSelector((state: RootState) =>
    workflowUuid ? canRenderShell(workflowUuid)(state) : false
  )
  const loadState = useSelector((state: RootState) =>
    workflowUuid ? selectWorkflowLoadState(workflowUuid)(state) : undefined
  )

  if (!workflowUuid) {
    return <ErrorView />
  }

  if (privateAccessRevoked) {
    return <WorkspaceAccessDenied workspace="workflow" />
  }

  if (isError && !resolvedWorkflowResponse) {
    if (getApiErrorStatus(error) === 403) {
      return (
        <WorkspaceAccessDenied
          workspace="workflow"
          archived={isArchivedApiError(error)}
        />
      )
    }
    return <ErrorView />
  }

  if (isPending || !resolvedWorkflowResponse) {
    return <Loader />
  }

  if (!shellReady && loadState?.graph !== 'failed') {
    return <Loader />
  }

  if (loadState?.graph === 'failed') {
    return <ErrorView />
  }

  return (
    <WorkspacePermissionsProvider
      resource={resolvedWorkflowResponse.item.permissions}
      project={resolvedWorkflowResponse.item.projectPermissions}
    >
      <WorkflowSidebarContextProvider>
        <WorkflowTabs />
      </WorkflowSidebarContextProvider>
    </WorkspacePermissionsProvider>
  )
}

export default Workflow
