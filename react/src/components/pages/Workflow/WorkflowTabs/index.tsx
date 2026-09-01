import { ResourceRole } from '@cf/api/gen/types.gen'
import { useWorkspacePermissions } from '@cf/context/workspacePermissionsContext'
import { selectSectionUuidsOrderedForGraph } from '@cf/features/graph/state/selectors/canonical.selectors'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import { OuterContentWrap } from '@cfMUI/helper'
import WorkspaceSidebar from '@cfPages/Workflow/Sidebar'
import type { WorkflowPageData } from '@cfPages/Workflow/types'
import Header from '@cfPages/Workflow/WorkflowTabs/components/Header'
import {
  ActionMenu,
  ExpandCollapseMenu,
  JumpToMenu
} from '@cfPages/Workflow/WorkflowTabs/components/menuBar'
import ConnectionBar from '@cfPages/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import WorkflowDialogs from '@cfPages/Workflow/WorkflowTabs/components/WorkflowDialogs'
import useWorkflowTabs from '@cfPages/Workflow/WorkflowTabs/hooks/useWorkflowTabs'
import { useWorkflowViewTypeFromRoute } from '@cfPages/Workflow/WorkflowTabs/hooks/useWorkflowViewTypeFromRoute'
import { useWorkflowSidebar } from '@cfSidebar/hooks/useSidebar'
import WorkflowLegend from '@cfViews/WorkflowView/GraphView/components/WorkflowLegend'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Routes, useParams } from 'react-router-dom'

/**
 * The base component of our workflow view. This renders the menu bar
 * above itself, the right sidebar, the header (description, sharing etc),
 * and then the tabs that allow the user to select a "type" of workflow view.
 */

const workflowChromeIsStrategy = false

const WorkflowTabs = ({
  workflow,
  publicView
}: {
  workflow: WorkflowPageData
  publicView: boolean
}) => {
  const { uuid } = useParams()
  const workflowViewType = useWorkflowViewTypeFromRoute()
  const { resource: permissions } = useWorkspacePermissions()
  const workflowChromePublicView =
    publicView || permissions.resourceRole === ResourceRole.PUBLIC

  const sectionIdsOrderedSelector = useMemo(
    () => selectSectionUuidsOrderedForGraph(workflow.graphUuid),
    [workflow.graphUuid]
  )
  const sectionIdsOrdered = useSelector(sectionIdsOrderedSelector)
  const workflowType = workflow.workflowType

  useWorkflowSidebar({
    workflowType,
    viewType: workflowViewType
  })

  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons } = useWorkflowTabs(
    workflow,
    { workflowView: workflowViewType },
    publicView
  )

  if (!uuid) {
    return null
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const ViewBar = () => (
    <Stack direction="row" spacing={2}>
      <JumpToMenu sectionIds={sectionIdsOrdered} />
      <ExpandCollapseMenu
        legend={<WorkflowLegend />}
        sectionIds={sectionIdsOrdered}
      />
    </Stack>
  )

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <>
      <div className="main-block">
        {!publicView && (
          <MenuBar
            leftSection={<ActionMenu />}
            viewbar={<ViewBar />}
            userbar={<ConnectionBar show={!workflowChromePublicView} />}
          />
        )}
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              <Header workflow={workflow} publicView={publicView} />
              {!workflowChromeIsStrategy && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <OuterContentWrap sx={{ pb: 0 }}>
                    <Tabs value={workflowViewType}>{tabButtons}</Tabs>
                  </OuterContentWrap>
                </Box>
              )}

              <div className="workflow-container">
                <Routes>{tabRoutes}</Routes>
              </div>
            </div>
          </div>

          {!publicView && <WorkspaceSidebar />}
        </div>
      </div>

      {!publicView && <WorkflowDialogs />}
    </>
  )
}

export default WorkflowTabs
