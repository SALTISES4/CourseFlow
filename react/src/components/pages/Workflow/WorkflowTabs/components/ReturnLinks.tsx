import { RootState } from '@cf/redux/store'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'
import { Link as RouterLink, generatePath } from 'react-router-dom'

/**
 * @todo did a first pass, but there is work to do still
 * not currently in design but feels like functionality is still important
 * data source and 'should show' logic not well managed currently
 */
const ReturnLinks = () => {
  const canView = true // @todo temp because project is not in store yet
  //  const project = useSelector((state: RootState) => state.workspace.project)
  const project = {
    uuid: 'temp-temp',
    title: 'fake title'
  }

  /*******************************************************
   * REDUX
   *******************************************************/
  // const publicView = useSelector(
  //   (state: RootState) => state.workspace.workflow?.publicView
  // )
  const publicView = true

  const BackToProjectLink = () => {
    if (!project || !project?.uuid || publicView) {
      return <></>
    }

    const path = generatePath(CFRoutes.PROJECT, {
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
            {_t('Return to')} {project.title}
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
    if (!publicView || !canView) {
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
            {_t('Return to')} {project.title}
          </Typography>
        </Box>
      </Link>
    )
  }

  // TODO:
  // this is not managed properly yet for if you are in a workflow or project view
  const BackToEditableWorkflowLink = () => {
    return null

    if (!publicView || !canView) {
      return <></>
    }

    const path = generatePath(CFRoutes.WORKFLOW, {
      uuid: String(project.uuid)
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
            {_t('Return to Editable Workflow')}
          </Typography>
        </Box>
      </Link>
    )
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
