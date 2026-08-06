import { getApiErrorStatus, isArchivedApiError } from '@cf/api/apiError'
import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkspacePermissionsProvider } from '@cf/context/workspacePermissionsContext'
import { useWorkspaceAccessGuard } from '@cf/hooks/useWorkspaceAccessGuard'
import { getErrorMessage } from '@cf/utility/errorWrapper'
import { _t } from '@cf/utility/Utility.class'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import Loader from '@cfComponents/UIPrimitives/Loader'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import WorkspaceAccessDenied from '@cfPages/MsgViews/WorkspaceAccessDenied'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import ProjectActionMenu from './components/ActionMenu'
import ProjectDialogs from './components/Dialogs'
import ProjectHeader from './components/Header'
import ProjectTabs from './components/Tabs'

const ProjectDetails = () => {
  const { uuid } = useParams()
  const location = useLocation()

  const { data, error, isLoading, isError, refetch } = useQuery({
    ...getProjectOptions({ path: { uuid: uuid ?? '' } }),
    enabled: Boolean(uuid)
  })

  // NOTE: can potentially be avoided via useQuery placeholderData: keepPreviousData?
  const lastResourceUuid = useRef(uuid)
  const lastSuccessfulResponse = useRef<typeof data>()

  if (lastResourceUuid.current !== uuid) {
    lastResourceUuid.current = uuid
    lastSuccessfulResponse.current = undefined
  }

  if (data) {
    lastSuccessfulResponse.current = data
  }

  const projectResponse = data ?? lastSuccessfulResponse.current
  const revalidate = useCallback(async () => {
    const result = await refetch()
    return result.error ?? null
  }, [refetch])

  const { privateAccessRevoked } = useWorkspaceAccessGuard({
    workspace: 'project',
    resourceUuid: uuid,
    resourceRole: projectResponse?.item.permissions.resourceRole,
    hasSuccessfulLoad: Boolean(lastSuccessfulResponse.current),
    directError: error,
    routePathname: location.pathname,
    revalidate
  })

  if (privateAccessRevoked) {
    return <WorkspaceAccessDenied workspace="project" />
  }

  if (isLoading) {
    return <Loader />
  }

  if (isError) {
    if (getApiErrorStatus(error) === 403) {
      return (
        <WorkspaceAccessDenied
          workspace="project"
          archived={isArchivedApiError(error)}
        />
      )
    }
    return (
      <ErrorView message={`An error occurred: ${getErrorMessage(error)}`} />
    )
  }

  if (isLoading || !projectResponse) {
    return <Loader />
  }

  const project = projectResponse.item

  if (!project) {
    return <ErrorView message={_t(`Project does not exist`)} />
  }

  return (
    <WorkspacePermissionsProvider resource={projectResponse.item.permissions}>
      <MenuBar leftSection={<ProjectActionMenu />} />
      <ProjectHeader project={project} />
      <ProjectTabs project={project} />
      <ProjectDialogs />
    </WorkspacePermissionsProvider>
  )
}

export default ProjectDetails
