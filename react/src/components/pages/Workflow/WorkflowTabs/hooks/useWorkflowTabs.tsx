import { WorkflowViewType } from '@cf/components/pages/Workflow/types'
import GraphView from '@cf/components/views/WorkflowView/GraphView'
import OutcomeEditView from '@cf/components/views/WorkflowView/OutcomeEditView'
import OverviewView from '@cf/components/views/WorkflowView/OverviewView'
import { WorkflowContextType } from '@cf/context/workFlowConfigContext'
import { EWorkflow } from '@cf/HTTP/XMLHTTP/types/entity'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import Tab from '@mui/material/Tab'
import { ReactNode } from 'react'
import { Route, generatePath, useNavigate, useParams } from 'react-router-dom'

const useWorkflowTabs = (workflow: EWorkflow, context: WorkflowContextType) => {
  const { uuid } = useParams()
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
      type: WorkflowViewType.GRAPH,
      route: CFRoutes.WORKFLOW_GRAPH,
      relRoute: RelativeRoutes.GRAPH,
      label: _t('Workflow'),
      content: <GraphView />,
      allowedTabs: [1, 2, 3, 4]
    },
    {
      type: WorkflowViewType.OUTCOME_EDIT,
      route: CFRoutes.WORKFLOW_OUTCOME_EDIT,
      relRoute: RelativeRoutes.OUTCOME_EDIT,
      label: _t('Outcomes'),
      content: <OutcomeEditView />,
      allowedTabs: workflow.type == 'program' ? [3] : [2, 3]
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
          const path = generatePath(item.route, { uuid })
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
