import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import WorkspaceSidebar from '@cfPages/Workspace/Workflow/Sidebar'
import { Placeholder } from '@cfPages/Workspace/Workflow/Sidebar/Draggable/Block/styles'
import { DraggableType } from '@cfPages/Workspace/Workflow/Sidebar/Draggable/Block/types'
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
import { sidebarDragTarget } from '@cfRedux/slices/sidebar.slice'
import { AppState } from '@cfRedux/types/type'
import WorkflowLegend from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/WorkflowLegend'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, matchPath } from 'react-router-dom'

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
  const context = useContext(WorkflowConfigContext)
  const workflow = useSelector((state: AppState) => state.workflow)
  const dispatch = useDispatch()
  const dragging = useSelector((state: AppState) => state.sidebar.dragging)

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

  function handleDragStart(event: DragStartEvent) {
    dispatch(sidebarDragTarget(event.active.data.current as DraggableType))
  }

  function handleDragEnd() {
    console.log(
      'stopped dragging',
      dragging.target,
      'at coords',
      dragging.coords
    )
    dispatch(sidebarDragTarget(null))
  }

  // Utility.logger({ context })

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  const ViewBar = () => (
    <>
      <JumpToMenu weekIds={workflow.weeks} />
      <ExpandCollapseMenu />
    </>
  )

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
          legendbar={<WorkflowLegend />}
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

          {/*<RightSideBar*/}
          {/*  wfcontext={WFContext.WORKFLOW}*/}
          {/*  data={this.props.data}*/}
          {/*  readOnly={this.readOnly}*/}
          {/*/>*/}
        </div>
      </div>
      <WorkflowDialogs />

      <DragOverlay>
        {!!dragging.target && (
          <Placeholder>
            <Typography variant="body2">{dragging.target.label}</Typography>
          </Placeholder>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default WorkflowTabs
