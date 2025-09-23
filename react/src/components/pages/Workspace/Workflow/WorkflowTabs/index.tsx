import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import WorkspaceSidebar from '@cfPages/Workspace/Workflow/Sidebar'
import { useWorkflowSidebar } from '@cfPages/Workspace/Workflow/Sidebar/hooks/useSidebar'
import Header from '@cfPages/Workspace/Workflow/WorkflowTabs/components/Header'
import ConnectionBar from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import {
  ActionMenu,
  JumpToMenu,
  ViewSettingsMenu
} from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/menus'
import WorkflowDialogs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/WorkflowDialogs'
import useWorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs/hooks/useWorkflowTabs'
import { RootState } from '@cfRedux/store'
import WorkflowLegend from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/WorkflowLegend'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import { useContext, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Routes, matchPath } from 'react-router-dom'

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
  const context = useContext(WorkflowConfigContext)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  useWorkflowSidebar({
    workflowType: workflow.type,
    viewType: context.workflowView
  })

  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons, tabs } = useWorkflowTabs(workflow, context)

  // @todo this is called originally via
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
  //   queryFn: () => getWorkflowParentDataQuery(workflow.id),
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

  // Utility.logger({ context })

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  const ViewBar = () => (
    <Stack direction="row" spacing={2}>
      <JumpToMenu weekIds={workflow.weeks} />
      <ExpandCollapseMenu legend={<WorkflowLegend />} />
      <ViewSettingsMenu />
    </Stack>
  )

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

      {/*
      this div has been randomly dropped here so we can still see the legacy selectmanager in action
      after that it can go
      */}
      <div id="edit-menu"></div>

      <div className="main-block">
        <MenuBar
          leftSection={<ActionMenu />}
          viewbar={<ViewBar />}
          userbar={<ConnectionBar show={!workflow.publicView} />}
        />
        <WorkflowLegend />
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              <Header />
              {!workflow.isStrategy && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <OuterContentWrap sx={{ pb: 0 }}>
                    <Tabs value={context.workflowView}>{tabButtons}</Tabs>
                  </OuterContentWrap>
                </Box>
              )}

              <div className="workflow-container">
                <Routes>{tabRoutes}</Routes>
              </div>
            </div>
          </div>

          <WorkspaceSidebar />

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
