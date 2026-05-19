import { WorkflowDetailOut, WorkflowDetailOutResp } from '@cf/api/gen'
import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowViewType } from '@cf/components/pages/Workflow/types'
import GraphView from '@cf/components/views/WorkflowView/GraphView'
import OutcomeEditView from '@cf/components/views/WorkflowView/OutcomeEditView'
import OverviewView from '@cf/components/views/WorkflowView/OverviewView'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import Tab from '@mui/material/Tab'
import { ReactNode } from 'react'
import { Route, generatePath, useNavigate, useParams } from 'react-router-dom'

export type WorkflowTabsRouteProps = {
  workflowView: WorkflowViewType
}

const useWorkflowTabs = (
  workflow: WorkflowDetailOutResp | undefined,
  _routeProps: WorkflowTabsRouteProps
) => {
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
  }[] =
    workflow == null
      ? []
      : [
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
            content: <GraphView graphUuid={workflow.item.graphUuid} />,
            allowedTabs: [1, 2, 3, 4]
          },
          {
            type: WorkflowViewType.OUTCOME_EDIT,
            route: CFRoutes.WORKFLOW_OUTCOME_EDIT,
            relRoute: RelativeRoutes.OUTCOME_EDIT,
            label: _t('Outcomes'),
            content: (
              <OutcomeEditView graphUuid={workflow.item.graphUuid} />
            ),
            allowedTabs: workflow.item.workflowType == 'program' ? [3] : [2, 3] // @todo enum
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
