import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import { WorkflowViewType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import Header from '@cfPages/Workspace/Workflow/WorkflowTabs/components/Header'
import ConnectionBar from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import {
  ActionMenu,
  ExpandCollapseMenu,
  JumpToMenu
} from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/menus'
import WorkflowDialogs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/WorkflowDialogs'
import useWorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs/hooks/useWorkflowTabs'
import { AppState } from '@cfRedux/types/type'
import { Box, Tabs } from '@mui/material'
import { useContext, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Routes, matchPath } from 'react-router-dom'

type WorkflowTabsManagerPropsType = {
  isStrategy: boolean
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
  const workflow = useSelector((state: AppState) => state.workflow)

  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons, tabs } = useWorkflowTabs({
    data
  })

  // @todo this is called originally via
  //    if (this.context.viewType === ViewType.OUTCOME_EDIT) {
  //    getWorkflowParentDataQuery(this.workflowId, (response) => {
  //      this.props.dispatch(
  //        ActionCreator.refreshStoreData(response.dataPackage)
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
        <JumpToMenu weekWorkflowSet={data.weekworkflowSet} />
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
          leftSection={<ActionMenu />}
          viewbar={<ViewBar />}
          userbar={<ConnectionBar show={!workflow.publicView} />}
        />
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              <Header />
              <WorkflowTabsManager isStrategy={workflow.isStrategy} />
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
