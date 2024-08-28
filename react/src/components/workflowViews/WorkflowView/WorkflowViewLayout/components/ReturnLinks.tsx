import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import * as React from 'react'
import { EProject } from '@XMLHTTP/types/entity'
import { Link } from 'react-router-dom'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'

type PropsType = {
  project: EProject
  isStudent: boolean
  publicView: boolean
  canView: boolean
}

const ReturnLinks = ({
  project,
  isStudent,
  publicView,
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
          {window.gettext('Return to')}{' '}
          <WorkflowTitle
            class_name="inline"
            no_hyperlink={true}
            data={project}
          />
        </div>
      </Link>
    ) : (
      <></>
    )

  const projectLink =
    publicView && canView ? (
      <Link
        className="hover-shade no-underline"
        id="project-return"
        // @todo no
        to={COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
          String(0),
          String(project.id)
        )}
      >
        <ArrowBackIosIcon />
        {window.gettext('Return to Editable Workflow')}
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

export default ReturnLinks
