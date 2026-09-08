import { getApiErrorStatus, isArchivedApiError } from '@cf/api/apiError'
import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import WorkspaceEditLockBanner from '@cf/components/common/WorkspaceEditLockBanner'
import { WorkspacePermissionsProvider } from '@cf/context/workspacePermissionsContext'
import { useWorkspaceAccessGuard } from '@cf/hooks/useWorkspaceAccessGuard'
import { useWorkspaceEditLock } from '@cf/hooks/useWorkspaceEditLock'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import Loader from '@cfComponents/UIPrimitives/Loader'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import WorkspaceAccessDenied from '@cfPages/MsgViews/WorkspaceAccessDenied'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'

import ProjectActionMenu from './components/ActionMenu'
import ProjectDialogs from './components/Dialogs'
import ProjectHeader from './components/Header'
import ProjectTabs from './components/Tabs'

const ProjectDetails = () => {
  const { t } = useTranslation('project')
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
  const editLock = useWorkspaceEditLock({
    workspace: 'project',
    resourceUuid: uuid ?? '',
    resourceRole: projectResponse?.item.permissions.resourceRole,
    resourceState: projectResponse?.item.permissions.state,
    reload: revalidate
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
    return <ErrorView message={t('errors.loadFailed')} />
  }

  if (isLoading || !projectResponse) {
    return <Loader />
  }

  const project = projectResponse.item

  if (!project) {
    return <ErrorView message={t('errors.notFound')} />
  }

  if (editLock.initialResolving) {
    return <Loader />
  }

  return (
    <WorkspacePermissionsProvider
      resource={projectResponse.item.permissions}
      resourceReadOnly={!editLock.editingEnabled}
    >
      <WorkspaceEditLockBanner
        lock={editLock.locked}
        takeoverPending={editLock.takeoverPending}
        onTakeover={editLock.takeover}
      />
      <MenuBar leftSection={<ProjectActionMenu />} />
      <ProjectHeader project={project} />
      <ProjectTabs project={project} />
      <ProjectDialogs />
    </WorkspacePermissionsProvider>
  )
}

export default ProjectDetails
