import { useCallback, useEffect, useRef, useState } from 'react'
import { produce } from 'immer'
// @local
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter'
import { ProjectMenuProps } from '@cfPages/Library/ProjectDetail/types'
import { Workflow } from '@cfModule/types/common'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import { Dialog, DialogTitle } from '@mui/material'
import Header from '@cfPages/Library/ProjectDetail/components/Header'
import ProjectEditDialog from '@cfCommonComponents/dialog/ProjectEditDialog'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu'
import MenuBar from '@cfCommonComponents/components/MenuBar'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { getWorkflowsForProjectQuery } from '@XMLHTTP/API/workflow'
import { EProject } from '@XMLHTTP/types/entity'
import ExportProjectModal from '@cfModule/components/common/dialog/ExportProject'
import ArchiveProjectModal from '@cfModule/components/common/dialog/ArchiveProject'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'
// import $ from 'jquery'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
interface StateType {
  data?: EProject
  view_type?: string
  users?: UsersForObjectQueryResp
  workflow_data?: Workflow[]
  openEditDialog?: boolean
  openShareDialog?: boolean
}

function ProjectMenu({
  data,
  userId,
  projectPaths,
  allDisciplines,
  readOnly
}: ProjectMenuProps) {
  const [state, setState] = useState<StateType>({
    data,
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
    getUsersForObjectQuery(data.id, data.type, (data) => {
      setState(
        produce((draft) => {
          draft.users = data
        })
      )
    })
  }, [data.id, data.type])

  useEffect(() => {
    getWorkflowsForProjectQuery(data.id, (data) => {
      setState(
        produce((draft) => {
          draft.workflow_data = data.data_package
        })
      )
    })

    getUserData()
    COURSEFLOW_APP.makeDropdown($(createDiv.current))
  }, [data.id, createDiv, getUserData])

  function deleteProject() {
    deleteSelfQuery(data.id, 'project', true, () => {
      setState(
        produce((draft) => {
          draft.data.deleted = true
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
      deleteSelfQuery(data.id, 'project', false, () => {
        window.location.href = COURSEFLOW_APP.config.home_path
      })
    }
  }

  function restoreProject() {
    restoreSelfQuery(data.id, 'project', () => {
      setState(
        produce((draft) => {
          draft.data.deleted = false
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
        draft.data = {
          ...draft.data,
          ...new_data
        }
        draft.openEditDialog = false
      })
    )
  }

  const DeleteProjectButton = () => {
    if (!state.data.deleted) {
      return (
        <div
          className="hover-shade"
          onClick={() => dispatch(DIALOG_TYPE.ARCHIVE_PROJECT)}
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
          onClick={() => dispatch(DIALOG_TYPE.EXPORT_PROJECT)}
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
              data.id,
              data.type,
              null,
              (response_data) => {
                loader.endLoad()
                window.location = COURSEFLOW_APP.config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
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
    const { data } = state

    const overflow_links = []

    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {window.gettext('Workflow comparison tool')}
      </a>
    )

    overflow_links.push(<hr />)
    overflow_links.push(<ExportButton />)
    overflow_links.push(<CopyButton />)

    if (data.author_id === userId) {
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
        project_data={state.data}
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
          data={state.data}
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
            ...state.data,
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

      <div className="project-menu">
        <Header
          disciplines={state.data.disciplines}
          description={state.data.description}
          allDisciplines={allDisciplines}
          data={state.data} // @todo this needs to be unpacked
          users={state.users}
          openShareDialog={openShareDialog}
          readOnly={readOnly}
        />
        <Content />
      </div>
      <EditDialog />
      <ShareDialog />
      <ExportProjectModal data={state.data} />
      <ArchiveProjectModal onSubmit={deleteProject} />
    </div>
  )
}

export default ProjectMenu
