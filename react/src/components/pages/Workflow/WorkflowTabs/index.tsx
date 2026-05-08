import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import MenuBar from '@cf/components/common/globalNav/MenuBar'
import WorkspaceSidebar from '@cf/components/pages/Workflow/Sidebar'
import { useWorkflowSidebar } from '@cf/components/pages/Workflow/Sidebar/hooks/useSidebar'
import { WorkflowType } from '@cf/components/pages/Workflow/types'
import Header from '@cf/components/pages/Workflow/WorkflowTabs/components/Header'
import {
  ExpandCollapseMenu,
  JumpToMenu
} from '@cf/components/pages/Workflow/WorkflowTabs/components/menuBar'
import ConnectionBar from '@cf/components/pages/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import WorkflowDialogs from '@cf/components/pages/Workflow/WorkflowTabs/components/WorkflowDialogs'
import useWorkflowTabs from '@cf/components/pages/Workflow/WorkflowTabs/hooks/useWorkflowTabs'
import WorkflowLegend from '@cf/components/views/WorkflowView/GraphView/components/WorkflowLegend'
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { RootState } from '@cf/redux/store'
import { OuterContentWrap } from '@cf/styles/mui/helper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Routes, matchPath, useParams } from 'react-router-dom'

import { ActionMenu } from '../../Project/components/MenuBar'

/**
 * The base component of our workflow view. This renders the menu bar
 * above itself, the right sidebar, the header (description, sharing etc),
 * and then the tabs that allow the user to select a "type" of workflow view.
 */

const WorkflowTabs = () => {
  const context = useContext(WorkflowConfigContext)
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''
  const { data: workflowDetailResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid } }),
    enabled: Boolean(workflowUuid)
  })
  const graphViewState = useSelector(
    (state: RootState) => state.workspace.workflow
  )
  const workflowType =
    (workflowDetailResp?.item.workflowType as WorkflowType | undefined) ??
    graphViewState.type

  useWorkflowSidebar({
    workflowType,
    viewType: context.workflowView
  })

  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons, tabs } = useWorkflowTabs(
    { ...graphViewState, type: workflowType },
    context
  )

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
      <JumpToMenu
        sectionIds={graphViewState.sections?.map((w) => w.toString())}
      />
      <ExpandCollapseMenu legend={<WorkflowLegend />} />
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
          userbar={<ConnectionBar show={!graphViewState.publicView} />}
        />
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              <Header />
              {!graphViewState.isStrategy && (
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
