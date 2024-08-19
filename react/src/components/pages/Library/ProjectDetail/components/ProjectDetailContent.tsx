import { useCallback, useEffect, useRef, useState } from 'react'
import { produce } from 'immer'
// @local
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter'
import { ProjectMenuProps } from '@cfPages/Library/ProjectDetail/types'
import { Workflow } from '@cfModule/types/common'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import { Box, Dialog, DialogTitle } from '@mui/material'
import Header from '@cfPages/Library/ProjectDetail/components/Header'
import ProjectEditDialog from '@cfCommonComponents/dialog/ProjectEditDialog'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu'
import MenuBar from '@cfCommonComponents/components/MenuBar'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { getWorkflowsForProjectQuery } from '@XMLHTTP/API/workflow'
import { EProject } from '@XMLHTTP/types/entity'
import ProjectExportModal from '@cfModule/components/common/dialog/ProjectExport'
import ProjectArchiveModal from '@cfModule/components/common/dialog/ProjectArchive'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'
// import $ from 'jquery'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
interface StateType {
  project?: EProject
  view_type?: string
  users?: UsersForObjectQueryResp
  workflow_data?: Workflow[]
  openEditDialog?: boolean
  openShareDialog?: boolean
}

function ProjectDetailContent({
  project,
  userId,
  projectPaths,
  allDisciplines,
  readOnly
}: ProjectMenuProps) {
  const [state, setState] = useState<StateType>({
    project,
    view_type: 'workflows',
    users: null,
    workflow_data: [],
    openEditDialog: false,
    openShareDialog: false
  })

  // to be able to show appropriate modals
  const { dispatch } = useDialog()

  const createDiv = useRef<HTMLDivElement>()

  // TODO: this is wrapped because it is called by openShareMenu
  // so do not unwrap until the renderMessageBox is sorted out
  const getUserData = useCallback(() => {
    getUsersForObjectQuery(project.id, project.type, (data) => {
      setState(
        produce((draft) => {
          draft.users = data
        })
      )
    })
  }, [project.id, project.type])

  useEffect(() => {
    getWorkflowsForProjectQuery(project.id, (data) => {
      setState(
        produce((draft) => {
          draft.workflow_data = data.data_package
        })
      )
    })

    getUserData()
    COURSEFLOW_APP.makeDropdown($(createDiv.current))
  }, [project.id, createDiv, getUserData])

  function deleteProject() {
    deleteSelfQuery(project.id, 'project', true, () => {
      setState(
        produce((draft) => {
          draft.project.deleted = true
        })
      )
    })
  }

  function deleteProjectHard() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently delete this project?'
        )
      )
    ) {
      deleteSelfQuery(project.id, 'project', false, () => {
        window.location.href = COURSEFLOW_APP.path.html.library.home
      })
    }
  }

  function restoreProject() {
    restoreSelfQuery(project.id, 'project', () => {
      setState(
        produce((draft) => {
          draft.project.deleted = false
        })
      )
    })
  }

  function updateWorkflow(id, new_values) {
    for (let i = 0; i < state.workflow_data.length; i++) {
      if (state.workflow_data[i].id === id) {
        const new_state = { ...state }
        new_state.workflow_data = [...state.workflow_data]
        new_state.workflow_data[i] = {
          ...state.workflow_data[i],
          ...new_values
        }
        setState(new_state)
        break
      }
    }
  }

  function openEditDialog() {
    setState(
      produce((draft) => {
        draft.openEditDialog = true
      })
    )
  }

  function openShareDialog() {
    setState(
      produce((draft) => {
        draft.openShareDialog = true
      })
    )
  }

  function closeModals() {
    setState(
      produce((draft) => {
        draft.openShareDialog = false
        draft.openEditDialog = false
      })
    )
  }

  function updateFunction(new_data) {
    setState(
      produce((draft) => {
        draft.project = {
          ...draft.project,
          ...new_data
        }
        draft.openEditDialog = false
      })
    )
  }

  const DeleteProjectButton = () => {
    if (!state.project.deleted) {
      return (
        <div
          className="hover-shade"
          onClick={() => dispatch(DIALOG_TYPE.PROJECT_ARCHIVE)}
        >
          <div>{window.gettext('Archive project')}</div>
        </div>
      )
    }
    return (
      <>
        <div className="hover-shade" onClick={restoreProject}>
          <div>{window.gettext('Restore project')}</div>
        </div>
        <div className="hover-shade" onClick={deleteProjectHard}>
          <div>{window.gettext('Permanently delete project')}</div>
        </div>
      </>
    )
  }

  const ExportButton = () => {
    if (userId) {
      return (
        <div
          id="export-button"
          className="hover-shade"
          onClick={() => dispatch(DIALOG_TYPE.PROJECT_EXPORT)}
          // onClick={openExportDialog}
        >
          <div>{window.gettext('Export')}</div>
        </div>
      )
    }
    return null
  }

  const CopyButton = () => {
    if (userId) {
      return (
        <div
          id="copy-button"
          className="hover-shade"
          onClick={() => {
            const loader = COURSEFLOW_APP.tinyLoader
            loader.startLoad()
            duplicateBaseItemQuery(
              project.id,
              project.type,
              null,
              (response_data) => {
                loader.endLoad()
                // @ts-ignore
                window.location =
                  COURSEFLOW_APP.path.html.update_path_temp.replace(
                    '0',
                  // @ts-ignore
                    response_data.new_item.id
                  )
              }
            )
          }}
        >
          <div>{window.gettext('Copy to my library')}</div>
        </div>
      )
    }
    return null
  }

  const OverflowLinks = () => {
    const { project } = state

    const overflow_links = []

    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {window.gettext('Workflow comparison tool')}
      </a>
    )

    overflow_links.push(<hr />)
    overflow_links.push(<ExportButton />)
    overflow_links.push(<CopyButton />)

    if (project.author_id === userId) {
      overflow_links.push(<hr />)
      overflow_links.push(<DeleteProjectButton />)
    }

    return overflow_links
  }

  /*******************************************************
   * VISIBLE BUTTONS
   *******************************************************/
  const Edit = () => {
    if (!readOnly) {
      return (
        <div
          className="hover-shade"
          id="edit-project-button"
          title={window.gettext('Edit Project')}
          onClick={openEditDialog}
        >
          <span className="material-symbols-rounded filled">edit</span>
        </div>
      )
    }
    return null
  }

  const Create = () => {
    if (!readOnly) {
      return (
        <div
          className="hover-shade"
          id="create-project-button"
          title={window.gettext('Create workflow')}
          ref={createDiv}
        >
          <span className="material-symbols-rounded filled">add_circle</span>
          <div id="create-links-project" className="create-dropdown">
            <a
              id="activity-create-project"
              href={projectPaths.activity}
              className="hover-shade"
            >
              {window.gettext('New activity')}
            </a>
            <a
              id="course-create-project"
              href={projectPaths.course}
              className="hover-shade"
            >
              {window.gettext('New course')}
            </a>
            <a
              id="program-create-project"
              href={projectPaths.program}
              className="hover-shade"
            >
              {window.gettext('New program')}
            </a>
          </div>
        </div>
      )
    }
    return null
  }

  const Share = () => {
    if (!readOnly)
      return (
        <div
          className="hover-shade"
          id="share-button"
          title={window.gettext('Sharing')}
          onClick={openShareDialog}
        >
          <span className="material-symbols-rounded filled">person_add</span>
        </div>
      )
    return null
  }

  const VisibleButtons = () => {
    return (
      <>
        <Edit />
        <Create />
        <Share />
      </>
    )
  }
  /*******************************************************
   *
   *******************************************************/
  const Content = () => {
    return (
      <WorkflowFilter
        read_only={readOnly}
        project_data={state.project}
        workflows={state.workflow_data}
        updateWorkflow={updateWorkflow}
        context="project"
      />
    )
  }

  const ShareDialog = () => {
    return (
      <Dialog open={state.openShareDialog}>
        <DialogTitle>
          <h2>{window.gettext('Share project')}</h2>
        </DialogTitle>
        <ShareMenu
          data={state.project}
          actionFunction={() => {
            setState(
              produce((draft) => {
                draft.openShareDialog = false
              })
            )
            getUserData()
          }}
        />
      </Dialog>
    )
  }

  const EditDialog = () => {
    return (
      <Dialog open={state.openEditDialog}>
        <ProjectEditDialog
          type={'project_edit_menu'}
          data={{
            ...state.project,
            all_disciplines: allDisciplines
            // renderer: renderer
          }}
          actionFunction={updateFunction}
          closeAction={closeModals}
        />
      </Dialog>
    )
  }

  return (
    <div className="main-block">
      <MenuBar
        overflowLinks={() => <OverflowLinks />}
        visibleButtons={() => <VisibleButtons />}
      />

      <Box>
        <Header
          disciplines={state.project.disciplines}
          description={state.project.description}
          allDisciplines={allDisciplines}
          project={state.project}
          users={state.users}
          openShareDialog={openShareDialog}
          readOnly={readOnly}
        />
        <Content />
      </Box>

      <EditDialog />
      <ShareDialog />
      <ProjectExportModal data={state.project} />
      <ProjectArchiveModal onSubmit={deleteProject} />
    </div>
  )
}

export default ProjectDetailContent
