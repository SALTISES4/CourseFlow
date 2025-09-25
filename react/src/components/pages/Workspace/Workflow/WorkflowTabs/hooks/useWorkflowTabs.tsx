import { WorkflowContextType } from '@cf/context/workFlowConfigContext'
import { EWorkflow } from '@cf/HTTP/XMLHTTP/types/entity'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import GridView from '@cfViews/WorkflowView/componentViews/GridView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2'
import OverviewView from '@cfViews/WorkflowView/componentViews/OverviewView'
import WorkflowEditView from '@cfViews/WorkflowView/componentViews/WorkflowEditView'
import Tab from '@mui/material/Tab'
import { ReactNode } from 'react'
import { Route, generatePath, useNavigate, useParams } from 'react-router-dom'

const useWorkflowTabs = (workflow: EWorkflow, context: WorkflowContextType) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const tabs: {
    type: WorkflowViewType
    route: CFRoutes
    relRoute: RelativeRoutes
    label: string
    content: ReactNode
    allowedTabs: number[]
    hidden?: boolean
  }[] = [
    {
      type: WorkflowViewType.OVERVIEW,
      route: CFRoutes.WORKFLOW,
      relRoute: RelativeRoutes.INDEX,
      label: _t('Overview'),
      content: <OverviewView />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.WORKFLOW,
      route: CFRoutes.WORKFLOW_WORKFLOW,
      relRoute: RelativeRoutes.WORKFLOW,
      label: _t('Workflow'),
      content: <WorkflowEditView />,
      allowedTabs: [1, 2, 3, 4]
    },
    {
      type: WorkflowViewType.OUTCOME_EDIT,
      route: CFRoutes.WORKFLOW_OUTCOME_EDIT,
      relRoute: RelativeRoutes.OUTCOME_EDIT,
      label: _t('Outcomes'),
      content: <OutcomeEditView />,
      allowedTabs: workflow.type == 'program' ? [3] : [2, 3]
    },
    {
      type: WorkflowViewType.GRID_VIEW,
      route: CFRoutes.WORKFLOW_GRID,
      relRoute: RelativeRoutes.GRID,
      label: _t('Grid view'),
      content: <GridView />,
      allowedTabs: [3],
      hidden: ['activity', 'course'].includes(workflow.type)
    }
  ]

  const tabButtons = tabs
    .filter((item) => !item.hidden)
    .map((item, index) => (
      <Tab
        key={index}
        label={item.label}
        value={item.type}
        onClick={() => {
          context.setWorkflowView(item.type)
          const path = generatePath(item.route, { id })
          navigate(path)
        }}
      />
    ))

  const tabRoutes = tabs
    .filter((item) => !item.hidden)
    .map((item, index) => (
      <Route
        key={index}
        index={item.relRoute === RelativeRoutes.INDEX}
        path={item.relRoute}
        element={item.content}
      />
    ))

  return { tabRoutes, tabButtons, tabs }
}

export default useWorkflowTabs
