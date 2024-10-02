// @ts-nocheck
// import WorkflowFilter from '@cfComponents/filters/WorkflowFilter'
import ProjectExportDialog from '@cf/components/common/dialog/Workspace/ProjectExportDialog'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import ProjectEditDialog from '@cfComponents/dialog/_LEGACY/ProjectEditDialog'
import ShareMenu from '@cfComponents/dialog/_LEGACY/ShareMenu'
import Header from '@cfPages/ProjectDetail/components/Header'
import { ProjectMenuProps } from '@cfPages/ProjectDetail/types'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { Box, Dialog, DialogTitle, Link } from '@mui/material'
import {
  deleteSelfQueryLegacy,
  restoreSelfQueryLegacy
} from '@XMLHTTP/API/delete'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { getUsersForObjectQueryLegacy } from '@XMLHTTP/API/sharing'
import { getWorkflowsForProjectQuery } from '@XMLHTTP/API/workflow'
import { ELibraryObject, EProject } from '@XMLHTTP/types/entity'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import ProjectArchiveDialog from 'components/common/_ARCHIVE/ProjectArchiveDialog'
import { produce } from 'immer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'


/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
interface StateType {
  project?: EProject
  viewType?: string
  users?: UsersForObjectQueryResp
  workflowData?: ELibraryObject[]
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
    viewType: 'workflows',
    users: null,
    workflowData: [],
    openEditDialog: false,
    openShareDialog: false
  })

  // to be able to show appropriate modals
  const { dispatch } = useDialog()

  const createDiv = useRef<HTMLDivElement>()

  // TODO: this is wrapped because it is called by openShareMenu
  // so do not unwrap until the renderMessageBox is sorted out
  const getUserData = useCallback(() => {
    getUsersForObjectQueryLegacy(project.id, project.type, (data) => {
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
          // @ts-ignore @todo not sure
          draft.workflowData = data.dataPackage
        })
      )
    })

    getUserData()
    COURSEFLOW_APP.makeDropdown($(createDiv.current))
  }, [project.id, createDiv, getUserData])

  function deleteProject() {
    deleteSelfQueryLegacy(project.id, 'project', true, () => {
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
        _t('Are you sure you want to permanently delete this project?')
      )
    ) {
      deleteSelfQueryLegacy(project.id, 'project', false, () => {
        window.location.href = CFRoutes.HOME
      })
    }
  }

  function restoreProject() {
    restoreSelfQueryLegacy(project.id, 'project', () => {
      setState(
        produce((draft) => {
          draft.project.deleted = false
        })
      )
    })
  }

  function updateWorkflow(id, newValues) {
    for (let i = 0; i < state.workflowData.length; i++) {
      if (state.workflowData[i].id === id) {
        const newState = { ...state }
        newState.workflowData = [...state.workflowData]
        newState.workflowData[i] = {
          ...state.workflowData[i],
          ...newValues
        }
        setState(newState)
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

  function updateFunction(newData) {
    setState(
      produce((draft) => {
        draft.project = {
          ...draft.project,
          ...newData
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
          onClick={() => dispatch(DialogMode.PROJECT_ARCHIVE)}
        >
          <div>{_t('Archive project')}</div>
        </div>
      )
    }
    return (
      <>
        <div className="hover-shade" onClick={restoreProject}>
          <div>{_t('Restore project')}</div>
        </div>
        <div className="hover-shade" onClick={deleteProjectHard}>
          <div>{_t('Permanently delete project')}</div>
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
          onClick={() => dispatch(DialogMode.PROJECT_EXPORT)}
          // onClick={openExportDialog}
        >
          <div>{_t('Export')}</div>
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
              (responseData) => {
                loader.endLoad()
                // @ts-ignore
                window.location =
                  COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
                    '0',
                    // @ts-ignore
                    responseData.newItem.id
                  )
              }
            )
          }}
        >
          <div>{_t('Copy to my library')}</div>
        </div>
      )
    }
    return null
  }

  const OverflowLinks = () => {
    const { project } = state

    const overflowLinks = []

    overflowLinks.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {_t('Workflow comparison tool')}
      </a>
    )

    overflowLinks.push(<hr />)
    overflowLinks.push(<ExportButton />)
    overflowLinks.push(<CopyButton />)

    if (project.authorId === userId) {
      overflowLinks.push(<hr />)
      overflowLinks.push(<DeleteProjectButton />)
    }

    return overflowLinks
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
          title={_t('Edit Project')}
          onClick={openEditDialog}
        >
          <EditIcon />
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
          title={_t('Create workflow')}
          ref={createDiv}
        >
          {/* filled */}
          <AddCircleIcon />
          <div id="create-links-project" className="create-dropdown">
            <Link
              component={RouterLink}
              id="activity-create-project"
              to={projectPaths.activity}
              className="hover-shade"
            >
              {_t('New activity')}
            </Link>
            <Link
              component={RouterLink}
              to={projectPaths.course}
              id="course-create-project"
              className="hover-shade"
            >
              {_t('New course')}
            </Link>
            <Link
              component={RouterLink}
              id="program-create-project"
              to={projectPaths.program}
              className="hover-shade"
            >
              {_t('New program')}
            </Link>
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
          title={_t('Sharing')}
          onClick={openShareDialog}
        >
          <PersonAddIcon />
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
      <></>
      // <WorkflowFilter
      //   readOnly={readOnly}
      //   projectData={state.project}
      //   workflows={state.workflowData}
      //   updateWorkflow={updateWorkflow}
      //   context="project"
      // />
    )
  }

  const ShareDialog = () => {
    return (
      <Dialog open={state.openShareDialog}>
        <DialogTitle>
          <h2>{_t('Share project')}</h2>
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
      {/*<MenuBar*/}
      {/*  overflowButtons={<OverflowLinks />}*/}
      {/*  visibleButtons={<VisibleButtons />}*/}
      {/*/>*/}

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

      {/*
      // 1 - @todo this has moved to project tabs
      // 2 - where to collect the dialogs
      <ProjectExportDialog data={state.project} />
*/}
      <ProjectArchiveDialog onSubmit={deleteProject} />
    </div>
  )
}

export default ProjectDetailContent
