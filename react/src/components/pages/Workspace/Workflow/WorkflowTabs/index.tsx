import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import RightSideBar from '@cfViews/components/rightSideBarContent/RightSideBar.js'
import * as Constants from '@cf/constants'

import { Dialog, DialogTitle } from '@mui/material'

import ShareMenu from '@cfComponents/dialog/ShareMenu.js'
import ExportMenu from '@cfComponents/dialog/ExportMenu.js'
import { AppState } from '@cfRedux/types/type'
import { ViewType } from '@cf/types/enum'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import ProjectTargetModal from '@cfComponents/dialog/ProjectTarget'
import ImportModal from '@cfComponents/dialog/Import'
import { getWorkflowParentDataQuery } from '@XMLHTTP/API/workflow'
import MenuBar from '@cfComponents/layout/MenuBar'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowViewTabs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/WorkflowViewTabs'
import ConnectionBar from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import Header from '@cfPages/Workspace/Workflow/WorkflowTabs/components/Header'
import { useContext, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UsersForObjectQueryResp,
  WorkflowParentDataQueryResp
} from '@XMLHTTP/types/query'
import {
  ActionMenu,
  ExpandCollapseMenu,
  JumpToMenu
} from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/Actions'

/***
 * @TODO NEED TO CLEAN UP TYPES
 * MAINLY REMOVE RENDERER IN THIS FILE AND
 AMD
 EditableComponent
 AND
 CommentBox
 ComponentWithToggleDrop

 */

type PropsType = {
  updateView: (viewType: ViewType) => void
}
// & EditableComponentProps

// type PropsType = DispatchProp & ConnectedProps & OwnProps
type StateType = {
  users: any
  openShareDialog: boolean
  openExportDialog: boolean
  openImportDialog: boolean
  openEditDialog: boolean
  data?: any
} // & EditableComponentStateType

/**
 * The base component of our workflow view. This renders the menu bar
 * above itself, the right sidebar, the header (description, sharing etc),
 * and then the tabs that allow the user to select a "type" of workflow view.
 */
// @todo was previously extending EditableComponentWithActions
// but as far as i can tell it uses nothing from
// EditableComponentWithActions or EditableComponentWithComments
// with possible exception of addDeleteSelf (which needs addressing independently)
// class WorkflowTabsUnconnected extends EditableComponent<PropsType, StateType> {
const WorkflowTabs = ({ updateView }: PropsType) => {
  const dispatch = useDispatch()
  const allowedTabs = [0, 1, 2, 3, 4]
  const disabledTabs = []
  // const selection_manager =     new SelectionManager(
  //     workflowPermission.readOnly
  //   )
  // Access state using useSelector
  const data = useSelector((state: AppState) => state.workflow)
  const objectSets = useSelector<AppState>((state: AppState) => state.objectset)
  const week = useSelector<AppState>((state: AppState) => state.week)
  const node = useSelector<AppState>((state: AppState) => state.node)
  const outcome = useSelector<AppState>((state: AppState) => state.outcome)

  const context = useContext(WorkFlowConfigContext)
  const [state, setState] = useState<StateType>({
    users: null,
    openShareDialog: false,
    openExportDialog: false,
    openImportDialog: false,
    openEditDialog: false
  })

  const {
    data: workflowParentData,
    error: workflowParentError,
    isLoading: workflowParentIsLoading,
    isError: workflowParentIsError
  } = useQuery<WorkflowParentDataQueryResp>({
    queryKey: ['getWorkflowParentDataQuery'],
    queryFn: () => getWorkflowParentDataQuery(data.id),
    enabled: context.viewType === ViewType.OUTCOME_EDIT
  })

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const {
    data: usersForObjectData,
    error: usersForObjectError,
    isLoading: usersForObjectIsLoading,
    isError: usersForObjectIsError
  } = useQuery<UsersForObjectQueryResp>({
    queryKey: ['getUsersForObjectQuery', 5],
    queryFn: () => getUsersForObjectQuery(5, 'workflow'),
    enabled: !context.public_view && !context.user.isStudent
  })

  function changeView(type: ViewType) {
    updateView(type)
  }

  /*******************************************************
   * MODALS, @todo move these into the global modal hook
   *******************************************************/

  function openShareDialog() {
    setState({
      ...state,
      openShareDialog: true
    })
  }

  function openExportDialog() {
    setState({
      ...state,
      openExportDialog: true
    })
  }

  function closeModals() {
    setState({
      ...state,
      openExportDialog: false,
      openShareDialog: false,
      openEditDialog: false
    })
  }

  function openImportDialog() {
    setState({
      ...state,
      openEditDialog: true
    })
  }

  function updateFunction(new_data) {
    if (new_data.liveproject) {
    } else {
      setState({
        ...state,
        data: {
          ...state.data,
          ...new_data
        },
        openEditDialog: false
      })
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const ShareDialog = () => {
    return (
      <Dialog open={state.openShareDialog}>
        <DialogTitle>
          <h2>{_t('Share project')}</h2>
        </DialogTitle>
        <ShareMenu
          data={data}
          actionFunction={() => {
            setState({
              ...state,
              openShareDialog: false
            })
            // getUserData()
          }}
        />
      </Dialog>
    )
  }

  const ViewBar = () => {
    return (
      <>
        <JumpToMenu
          viewType={context.viewType}
          weekWorkflowSet={data.weekworkflow_set}
        />
        <ExpandCollapseMenu />
      </>
    )
  }

  const ExportDialog = () => {
    return (
      <Dialog open={state.openExportDialog}>
        <DialogTitle>
          <h2>{_t('Export project')}</h2>
        </DialogTitle>
        <ExportMenu
          data={{
            ...data,
            object_sets: objectSets
          }}
          actionFunction={closeModals}
        />
      </Dialog>
    )
  }

  // clickImport(import_type, evt) {
  //   evt.preventDefault()
  //   renderMessageBox(
  //     {
  //       object_id: this.props.data.id,
  //       object_type: this.objectType,
  //       import_type: import_type
  //     },
  //     'import',
  //     () => {
  //       closeMessageBox()
  //     }
  //   )
  // }

  // ImportDialog = () => {
  //   return (
  //     <Dialog open={this.state.openImportDialog}>
  //       <>
  //         <ImportMenu
  //           data={{
  //             object_id: this.data.id,
  //             object_type: this.objectType,
  //             import_type: 'outcomes'
  //           }}
  //           actionFunction={this.closeModals}
  //         />
  //         <ImportMenu
  //           data={{
  //             object_id: this.data.id,
  //             object_type: this.objectType,
  //             import_type: 'nodes'
  //           }}
  //           actionFunction={this.closeModals}
  //         />
  //       </>
  //     </Dialog>
  //   )
  // }

  const duplicateItem = () => {
    console.log('duplicateItem')
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <>
      {
        // @todo leave as reference, this 'invokes' the right sidebar into a portal
        // it's trying to set up the right side bar context from current workflow data
        // theres is no reason for it be here
        // this.addEditable(this.props.data)
      }

      <div className="main-block">
        <MenuBar
          leftSection={<ActionMenu isWorkflowDeleted={data.deleted} />}
          viewbar={<ViewBar />}
          userbar={<ConnectionBar show={!context.public_view} />}
        />
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">

              {/*
              legacy overbiew section
              */}
              <Header
                users={usersForObjectData}
                data={data}
                openShareDialog={openShareDialog}
              />

              <WorkflowViewTabs
                isStrategy={context.workflow.is_strategy}
                viewType={context.viewType}
                data={data} // @todo clean this up
                changeView={changeView}
              />
            </div>
          </div>

          {/*<RightSideBar*/}
          {/*  wfcontext={WFContext.WORKFLOW}*/}
          {/*  data={this.props.data}*/}
          {/*  readOnly={this.readOnly}*/}
          {/*/>*/}
        </div>

        <ProjectTargetModal
          id={data.id}
          //@ts-ignore
          actionFunction={duplicateItem}
        />
        <ImportModal workflowID={data.id} />
        <ShareDialog />
      </div>
    </>
  )
}

export default WorkflowTabs
