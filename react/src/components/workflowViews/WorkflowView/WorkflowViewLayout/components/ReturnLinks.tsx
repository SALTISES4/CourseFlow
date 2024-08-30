import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import * as React from 'react'
import { EProject } from '@XMLHTTP/types/entity'
import { Link } from 'react-router-dom'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { connect, DispatchProp } from 'react-redux'
import { AppState } from '@cfRedux/types/type'
import Typography from '@mui/material/Typography'
import { _t } from '@cf/utility/utilityFunctions'

type ConnectedProps = {
  project: EProject
  isStudent: boolean
  publicView: boolean
  canView: boolean
}
type OwnProps = NonNullable<unknown>
type PropsType = DispatchProp & ConnectedProps & OwnProps
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
const ReturnLinksUnconnected = ({
  isStudent,
  publicView,
  project,
  canView
}: PropsType) => {
  const workflowLinks =
    project && !isStudent && !publicView ? (
      <Link
        className="hover-shade no-underline"
        id="project-return"
        to={COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
          String(0),
          String(project.id)
        )}
      >
        <ArrowBackIosIcon />
        <div>
          <Typography>{_t('Return to')}</Typography>
          {
            // doesn't work for now because project is not in store
            0 && (
              <WorkflowTitle
                class_name="inline"
                no_hyperlink={true}
                data={project}
              />
            )
          }
        </div>
      </Link>
    ) : (
      <></>
    )

  const projectLink =
    publicView && canView ? (
      <Link
        id="project-return"
        // @todo no
        to={COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
          String(0),
          String(project.id)
        )}
      >
        <ArrowBackIosIcon />
        {_t('Return to Editable Workflow')}
      </Link>
    ) : (
      <></>
    )

  return (
    <>
      {workflowLinks}
      {projectLink}
    </>
  )
}

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    project: dummyProject as unknown as EProject, // @todo temp because project is not in store yet
    isStudent: false, // @todo temp because project is not in store yet
    publicView: state.workflow.public_view,
    canView: true // @todo temp because project is not in store yet
  }
}

const ReturnLinks = connect<ConnectedProps, DispatchProp, OwnProps, AppState>(
  mapStateToProps,
  null
)(ReturnLinksUnconnected)

export default ReturnLinks
