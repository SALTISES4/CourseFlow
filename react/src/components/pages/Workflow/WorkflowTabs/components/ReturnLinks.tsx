import {
  getProjectOptions,
  getWorkflowOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { CFRoutes } from '@cf/router/appRoutes'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink, generatePath, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * @todo did a first pass, but there is work to do still
 * not currently in design but feels like functionality is still important
 * data source and 'should show' logic not well managed currently
 */
const ReturnLinks = () => {
  const { t } = useTranslation('workflow')
  const workflowMatch = useMatch({ path: CFRoutes.WORKFLOW, end: false })
  const workflowUuid = workflowMatch?.params.uuid

  const { data: workflowDetailResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid! } }),
    enabled: Boolean(workflowUuid)
  })

  const projectUuid = workflowDetailResp?.item.projectUuid ?? null

  const { data: projectDetailResp } = useQuery({
    ...getProjectOptions({ path: { uuid: projectUuid! } }),
    enabled: Boolean(projectUuid)
  })

  const project = projectDetailResp?.item
    ? {
        uuid: projectDetailResp.item.uuid,
        title: projectDetailResp.item.title
      }
    : null

  const canView = Boolean(project)
  // @todo temp because project is not in store yet
  // TODO(graph-state): Plumb `publicView` from workflow detail or route when public workflow links exist.
  const publicView = false

  const BackToProjectLink = () => {
    if (!project?.uuid || publicView) {
      return <></>
    }

    const path = generatePath(CFRoutes.PROJECT_WORKFLOW, {
      uuid: project.uuid
    })

    return (
      <Link
        id="project-return"
        to={path}
        underline="hover"
        component={RouterLink}
      >
        <Box sx={{ display: 'flex' }}>
          <ArrowBackIosIcon color="primary" />
          <Typography color="primary">
            {t('related.returnTo')} {project.title}
          </Typography>
        </Box>
      </Link>
    )
  }

  // TODO:
  // if you are viewing the public link, and you have edit permissions (?)
  // this returns you to the editable version
  // not really understanding this yet, why not use the same link but with view permissions for all users?
  const BackToEditableProjectLink = () => {
    if (!publicView || !canView || !project?.uuid) {
      return <></>
    }

    const path = generatePath(CFRoutes.PROJECT, {
      uuid: String(project.uuid)
    })

    return (
      <Link
        id="editable-project-return"
        data-test-id="link-editable-project-return"
        to={path}
        underline="hover"
        component={RouterLink}
      >
        <Box sx={{ display: 'flex' }}>
          <ArrowBackIosIcon color="primary" />
          <Typography color="primary">
            {t('related.returnTo')} {project.title}
          </Typography>
        </Box>
      </Link>
    )
  }

  // TODO:
  // this is not managed properly yet for if you are in a workflow or project view
  const BackToEditableWorkflowLink = () => {
    return null

    if (!publicView || !canView || !workflowUuid) {
      return <></>
    }

    const path = generatePath(CFRoutes.WORKFLOW, {
      uuid: String(workflowUuid)
    })

    return (
      <Link
        id="editable-workflow-return"
        data-test-id="link-editable-workflow-return"
        to={path}
        underline="hover"
        component={RouterLink}
      >
        <Box sx={{ display: 'flex' }}>
          <ArrowBackIosIcon color="primary" />
          <Typography color="primary">
            {t('related.returnToEditable')}
          </Typography>
        </Box>
      </Link>
    )
  }

  if (!workflowUuid || !project) {
    return null
  }

  return (
    <Box className="back-links-wrap">
      <BackToProjectLink />
      <BackToEditableProjectLink />
      <BackToEditableWorkflowLink />
    </Box>
  )
}

export default ReturnLinks
