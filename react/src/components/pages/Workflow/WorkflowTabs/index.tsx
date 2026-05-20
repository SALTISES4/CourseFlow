import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import MenuBar from '@cf/components/common/globalNav/MenuBar'
import Loader from '@cf/components/common/UIPrimitives/Loader'
import WorkspaceSidebar from '@cf/components/pages/Workflow/Sidebar'
import { useWorkflowSidebar } from '@cf/components/pages/Workflow/Sidebar/hooks/useSidebar'
import { WorkflowType } from '@cf/components/pages/Workflow/types'
import Header from '@cf/components/pages/Workflow/WorkflowTabs/components/Header'
import {
  ActionMenu,
  ExpandCollapseMenu,
  JumpToMenu
} from '@cf/components/pages/Workflow/WorkflowTabs/components/menuBar'
import ConnectionBar from '@cf/components/pages/Workflow/WorkflowTabs/components/menuBar/ConnectionBar'
import WorkflowDialogs from '@cf/components/pages/Workflow/WorkflowTabs/components/WorkflowDialogs'
import useWorkflowTabs from '@cf/components/pages/Workflow/WorkflowTabs/hooks/useWorkflowTabs'
import { useWorkflowViewTypeFromRoute } from '@cf/components/pages/Workflow/WorkflowTabs/hooks/useWorkflowViewTypeFromRoute'
import WorkflowLegend from '@cf/components/views/WorkflowView/GraphView/components/WorkflowLegend'
import { selectSectionUuidsOrderedForGraph } from '@cf/features/graph/state/selectors/canonical.selectors'
import { OuterContentWrap } from '@cf/styles/mui/helper'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Routes, useParams } from 'react-router-dom'

/**
 * The base component of our workflow view. This renders the menu bar
 * above itself, the right sidebar, the header (description, sharing etc),
 * and then the tabs that allow the user to select a "type" of workflow view.
 */

// TODO(graph-state): Plumb `publicView` and `isStrategy` from canonical workflow meta or workflow detail API when available (legacy `workspace.workflow` is not mounted on RootState). Defaults match signed-in editor behavior.
const workflowChromePublicView = false
const workflowChromeIsStrategy = false

const WorkflowTabs = () => {
  const { uuid } = useParams()
  const workflowViewType = useWorkflowViewTypeFromRoute()

  const {
    data: workflowDetailResp,
    isPending,
    isFetching,
    isError
  } = useQuery({
    ...getWorkflowOptions({
      path: {
        uuid: uuid ?? ''
      }
    }),
    enabled: Boolean(uuid)
  })

  const sectionIdsOrderedSelector = useMemo(
    () =>
      selectSectionUuidsOrderedForGraph(workflowDetailResp?.item?.graphUuid),
    [workflowDetailResp?.item?.graphUuid]
  )
  const sectionIdsOrdered = useSelector(sectionIdsOrderedSelector)

  const workflowType = workflowDetailResp?.item.workflowType

  useWorkflowSidebar({
    workflowType, // enum no properly assigned in python schema
    viewType: workflowViewType
  })

  // @todo should be memoized (calling the tabs per render)
  const { tabRoutes, tabButtons } = useWorkflowTabs(workflowDetailResp, {
    workflowView: workflowViewType
  })

  if (!uuid) {
    return null
  }

  if (!workflowDetailResp && (isPending || isFetching)) {
    return <Loader />
  }

  if (!workflowDetailResp && isError) {
    return <ErrorView />
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const ViewBar = () => (
    <Stack direction="row" spacing={2}>
      <JumpToMenu sectionIds={sectionIdsOrdered} />
      <ExpandCollapseMenu legend={<WorkflowLegend />} />
    </Stack>
  )

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <>
      <div className="main-block">
        <MenuBar
          leftSection={<ActionMenu />}
          viewbar={<ViewBar />}
          userbar={<ConnectionBar show={!workflowChromePublicView} />}
        />
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              <Header />
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

          <WorkspaceSidebar />
        </div>
      </div>

      <WorkflowDialogs />
    </>
  )
}

export default WorkflowTabs
