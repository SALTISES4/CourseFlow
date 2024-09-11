import { CFRoutes } from '@cf/router'
import { _t } from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { EProject } from '@XMLHTTP/types/entity'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link, generatePath } from 'react-router-dom'

const dummyProject = {
  deleted: false,
  deleted_on: '2023/12/27',
  id: 3,
  title: 'test project(copy)',
  description: 'i am a test project description',
  author: 'adray3',
  author_id: 2,
  published: false,
  created_on: '2023/12/27',
  is_template: false,
  last_modified: '2023/12/27',
  workflowproject_set: [8, 9, 10, 11],
  disciplines: [],
  type: 'project',
  object_sets: [],
  favourite: true,
  object_permission: {
    permission_type: 2,
    last_viewed: '2024-08-23T21:22:51.834Z'
  }
}

/**
 * @todo did a first pass, but there is work to do still
 * not currently in design but feels like functionality is still important
 * data source and 'should show' logic not well managed currently
 */
const ReturnLinks = () => {
  const project = dummyProject as unknown as EProject // @todo temp because project is not in store yet
  const isStudent = false // @todo temp because project is not in store yet
  const canView = true // @todo temp because project is not in store yet

  /*******************************************************
   * REDUX
   *******************************************************/
  const publicView = useSelector<AppState>(
    (state: AppState) => state.workflow.public_view
  )

  const WorkflowLink = () => {
    if (!project || isStudent || publicView) {
      return <></>
    }

    const path = generatePath(CFRoutes.PROJECT, {
      id: String(project.id)
    })

    const title = 'placeholder title ' // @todo,  helper function that assembles the title
    return (
      <Link className="hover-shade no-underline" id="project-return" to={path}>
        <Box sx={{ display: 'flex' }}>
          <ArrowBackIosIcon color={'primary'} />
          <Typography color={'primary'}>
            {_t('Return to')} {title}
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
