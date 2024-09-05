import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import { WorkflowViewType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import MenuBar from '@cfComponents/layout/MenuBar'
import Header from '@cfPages/Workspace/Workflow/WorkflowTabs/components/Header'
import {
  ActionMenu,
  ExpandCollapseMenu,
  JumpToMenu
} from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/Actions'
import ConnectionBar from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import WorkflowDialogs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/dialogs'
import useWorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/useWorkflowTabs'
import { AppState } from '@cfRedux/types/type'
import { Box, Tabs } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import * as React from 'react'
import { useContext, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Routes, matchPath } from 'react-router-dom'

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
  const data = useSelector((state: AppState) => state.workflow)
  const context = useContext(WorkFlowConfigContext)
  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons, tabs } = useWorkflowTabs({
    data
  })

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
  //   enabled: context.workflowView === ViewType.OUTCOME_EDIT
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

  useEffect(() => {
    const match = tabs.find((tab) =>
      matchPath({ path: tab.route, end: true }, location.pathname)
    )
    if (match && context.workflowView !== match.type) {
      context.setWorkflowView(match.type)
    }
  }, [])

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
    isStrategy
  }: WorkflowTabsManagerPropsType) => {
    const { workflowView } = useContext(WorkFlowConfigContext)

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
      <WorkflowDialogs />
    </>
  )
}

export default WorkflowTabs
