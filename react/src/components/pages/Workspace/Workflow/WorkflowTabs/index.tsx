import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import RightSideBar from '@cfViews/components/rightSideBarContent/RightSideBar.js'
import * as Constants from '@cf/constants'

import { Box, Dialog, DialogTitle, Tabs } from '@mui/material'

import ShareMenu from '@cfComponents/dialog/ShareMenu.js'
import ExportMenu from '@cfComponents/dialog/ExportMenu.js'
import { AppState } from '@cfRedux/types/type'
import { WorkflowViewType } from '@cf/types/enum'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import ProjectTargetModal from '@cfComponents/dialog/ProjectTarget'
import ImportModal from '@cfComponents/dialog/Import'
import { getWorkflowParentDataQuery } from '@XMLHTTP/API/workflow'
import MenuBar from '@cfComponents/layout/MenuBar'
import { _t } from '@cf/utility/utilityFunctions'
import ConnectionBar from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import Header from '@cfPages/Workspace/Workflow/WorkflowTabs/components/Header'
import { useContext, useEffect, useState } from 'react'
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
import { generatePath, Routes, useNavigate } from 'react-router-dom'
import { OuterContentWrap } from '@cf/mui/helper'
import useWorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/useWorkflowTabs'
import ActionCreator from '@cfRedux/ActionCreator'

type WorkflowTabsManagerPropsType = {
  isStrategy: boolean
  data: any
}

// & EditableComponentProps

// type PropsType = DispatchProp & ConnectedProps & OwnProps
type StateType = {
  users: any
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
const WorkflowTabs = () => {
  const dispatch = useDispatch()
  const allowedTabs = [0, 1, 2, 3, 4]
  const disabledTabs = []
  // const selection_manager =     new SelectionManager(
  //     workflowPermission.readOnly
  //   )
  // Access state using useSelector
  const data = useSelector((state: AppState) => state.workflow)

  const context = useContext(WorkFlowConfigContext)

  // @todo this is called originally via
  //    if (this.context.viewType === ViewType.OUTCOME_EDIT) {
  //    getWorkflowParentDataQuery(this.workflowId, (response) => {
  //      this.props.dispatch(
  //        ActionCreator.refreshStoreData(response.data_package)
  //      )
  //    })
  //  }
  //
  //   in component did mount
  //   move it to outcomedit view
  // const {
  //   data: workflowParentData,
  //   error: workflowParentError,
  //   isLoading: workflowParentIsLoading,
  //   isError: workflowParentIsError
  // } = useQuery<WorkflowParentDataQueryResp>({
  //   queryKey: ['getWorkflowParentDataQuery'],
  //   queryFn: () => getWorkflowParentDataQuery(data.id),
  //   enabled: context.viewType === ViewType.OUTCOME_EDIT
  // })

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

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  const ViewBar = () => {
    return (
      <>
        <JumpToMenu weekWorkflowSet={data.weekworkflow_set} />
        <ExpandCollapseMenu />
      </>
    )
  }

  const WorkflowTabsManager = ({
    isStrategy,
    data
  }: WorkflowTabsManagerPropsType) => {
    const { workflowView } = useContext(WorkFlowConfigContext)
    const [tab, setTab] = useState<WorkflowViewType>()

    console.log('tab outizsde')
    console.log(tab)
    // @todo should be memoized (calling the tabs per render)
    const { tabRoutes, tabButtons } = useWorkflowTabs({
      data
    })

    if (isStrategy) {
      return (
        <div className="workflow-container">
          <Routes>{tabRoutes}</Routes>
        </div>
      )
    }

    return (
      <>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <OuterContentWrap sx={{ pb: 0 }}>
            {/* workflowView is initialized in the tabs hook controller useWorkflowTabs
            i don't like this much, but it works for now. you can tell we're interrupting the render
            because we're not seeing the tab slide animation
             something to reconsider when  we get a better control on react router paradigms */}
            <Tabs
              value={workflowView}
              onChange={(_, newValue: WorkflowViewType) => {}}
            >
              {tabButtons}
            </Tabs>
          </OuterContentWrap>
        </Box>

        <div className="workflow-container">
          <Routes>{tabRoutes}</Routes>
        </div>
      </>
    )
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
              <Header
                isStrategy={data.is_strategy}
                workflowType={data.type}
                title={data.title}
                code={data.code}
                deleted={data.deleted}
              />

              <WorkflowTabsManager
                isStrategy={context.workflow.is_strategy}
                data={data} // @todo clean this up
              />
            </div>
          </div>

          {/*<RightSideBar*/}
          {/*  wfcontext={WFContext.WORKFLOW}*/}
          {/*  data={this.props.data}*/}
          {/*  readOnly={this.readOnly}*/}
          {/*/>*/}
        </div>
      </div>
    </>
  )
}

export default WorkflowTabs
