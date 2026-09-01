import { getApiErrorStatus, isArchivedApiError } from '@cf/api/apiError'
import {
  getPublicWorkflowOptions,
  getWorkflowOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { WorkflowDetailOutResp } from '@cf/api/gen/types.gen'
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
import type { WorkflowPageData } from '@cfPages/Workflow/types'
import WorkflowTabs from '@cfPages/Workflow/WorkflowTabs'
import { WorkflowSidebarContextProvider } from '@cfSidebar/hooks/useSidebar/context'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'

type WorkflowContentProps = {
  workflow: WorkflowPageData
  publicView: boolean
}

const WorkflowContent = ({ workflow, publicView }: WorkflowContentProps) => {
  const workflowUuid = workflow.uuid
  useGraphBootstrap(workflowUuid, publicView)

  const shellReady = useSelector((state: RootState) =>
    canRenderShell(workflowUuid)(state)
  )
  const loadState = useSelector((state: RootState) =>
    selectWorkflowLoadState(workflowUuid)(state)
  )

  if (!shellReady && loadState?.graph !== 'failed') {
    return <Loader />
  }

  if (loadState?.graph === 'failed') {
    return <ErrorView />
  }

  return (
    <WorkspacePermissionsProvider
      resource={workflow.permissions}
      project={
        'projectPermissions' in workflow
          ? workflow.projectPermissions
          : undefined
      }
    >
      <WorkflowSidebarContextProvider>
        <WorkflowTabs workflow={workflow} publicView={publicView} />
      </WorkflowSidebarContextProvider>
    </WorkspacePermissionsProvider>
  )
}

const AuthenticatedWorkflow = () => {
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
  const lastSuccessfulResponse = useRef<WorkflowDetailOutResp>()
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

  return (
    <WorkflowContent
      workflow={resolvedWorkflowResponse.item}
      publicView={false}
    />
  )
}

const PublicWorkflow = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const workflowUuid = uuid ?? null
  const { data, isError, isPending } = useQuery({
    ...getPublicWorkflowOptions({ path: { uuid: workflowUuid ?? '' } }),
    enabled: Boolean(workflowUuid)
  })

  if (!workflowUuid) {
    return <ErrorView />
  }

  if (isError) {
    return <ErrorView message="This workflow is not publicly available" />
  }

  if (isPending || !data) {
    return <Loader />
  }

  return <WorkflowContent workflow={data.item} publicView />
}

const Workflow = ({ publicView = false }: { publicView?: boolean }) =>
  publicView ? <PublicWorkflow /> : <AuthenticatedWorkflow />

export default Workflow
