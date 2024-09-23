import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link, generatePath } from 'react-router-dom'

/**
 * @todo did a first pass, but there is work to do still
 * not currently in design but feels like functionality is still important
 * data source and 'should show' logic not well managed currently
 */
const ReturnLinks = () => {
  const canView = true // @todo temp because project is not in store yet
  const project = useSelector((state: AppState) => state.parentProject)

  /*******************************************************
   * REDUX
   *******************************************************/
  const publicView = useSelector<AppState>(
    (state: AppState) => state.workflow?.publicView
  )

  const WorkflowLink = () => {
    // @todo not sure about this check yet, redux store is not stable
    if (!project || !project?.id || publicView) {
      return <></>
    }

    const path = generatePath(CFRoutes.PROJECT, {
      id: String(project.id)
    })

    return (
      <Link className="hover-shade no-underline" id="project-return" to={path}>
        <Box sx={{ display: 'flex' }}>
          <ArrowBackIosIcon color={'primary'} />
          <Typography color={'primary'}>
            {_t('Return to')} {project.title}
          </Typography>
        </Box>
      </Link>
    )
  }

  // if you are viewing the public link, and you have edit permissions (?)
  // this returns you to the editable version
  // not really understanding this yet, why not use the same link but with view permissions for all users?
  const EditableProjectLink = () => {
    if (!publicView || !canView) return <></>

    const path = generatePath(CFRoutes.PROJECT, {
      id: String(project.id)
    })
    return (
      <Link data-test-id={'link-editable-workflow-return'} to={path}>
        <ArrowBackIosIcon />
        {_t('Return to Editable Project')}
      </Link>
    )
  }

  // this is not managed properly yet for if you are in a workflow or project view
  const EditableWorkflowLink = () => {
    if (!publicView || !canView) return <></>

    const path = generatePath(CFRoutes.WORKFLOW, {
      id: String(project.id)
    })
    return (
      <Link data-test-id={'link-editable-workflow-return'} to={path}>
        <ArrowBackIosIcon />
        {_t('Return to Editable Project')}
      </Link>
    )
  }

  return (
    <>
      <WorkflowLink />
      <EditableProjectLink />
      <EditableWorkflowLink />
    </>
  )
}

export default ReturnLinks
