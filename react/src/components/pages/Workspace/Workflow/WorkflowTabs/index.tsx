import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import WorkspaceSidebar from '@cfPages/Workspace/Workflow/Sidebar'
import { useWorkflowSidebar } from '@cfPages/Workspace/Workflow/Sidebar/hooks/useSidebar'
import Header from '@cfPages/Workspace/Workflow/WorkflowTabs/components/Header'
import ConnectionBar from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import {
  ActionMenu,
  ExpandCollapseMenu,
  JumpToMenu
} from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/menus'
import WorkflowDialogs from '@cfPages/Workspace/Workflow/WorkflowTabs/components/WorkflowDialogs'
import useWorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs/hooks/useWorkflowTabs'
import { RootState } from '@cfRedux/store'
import Index from '@cfViews/WorkflowView/WorkflowEditView/components/WorkflowLegend'
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

const WorkflowTabs = () => {
  const context = useContext(WorkflowConfigContext)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  useWorkflowSidebar({
    workflowType: workflow.type,
    viewType: context.workflowView
  })

  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons, tabs } = useWorkflowTabs(workflow, context)

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

  const ViewBar = () => (
    <Stack direction="row" spacing={2}>
      <JumpToMenu weekIds={workflow.weeks} />
      <ExpandCollapseMenu legend={<Index />} />
    </Stack>
  )

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <>
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
        </div>
      </div>

      <WorkflowDialogs />
    </>
  )
}

export default WorkflowTabs
