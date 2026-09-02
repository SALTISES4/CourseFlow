import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import {
  type WorkflowPageData,
  WorkflowViewType
} from '@cfPages/Workflow/types'
import GraphView from '@cfViews/WorkflowView/GraphView'
import OutcomeEditView from '@cfViews/WorkflowView/OutcomeEditView'
import OverviewView from '@cfViews/WorkflowView/OverviewView'
import Tab from '@mui/material/Tab'
import { ReactNode } from 'react'
import { Route, generatePath, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export type WorkflowTabsRouteProps = {
  workflowView: WorkflowViewType
}

const useWorkflowTabs = (
  workflow: WorkflowPageData | undefined,
  _routeProps: WorkflowTabsRouteProps,
  publicView = false
) => {
  const { t } = useTranslation('workflow')
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
            label: t('tabs.overview'),
            content: (
              <OverviewView workflow={workflow} publicView={publicView} />
            ),
            allowedTabs: [3]
          },
          {
            type: WorkflowViewType.GRAPH,
            route: CFRoutes.WORKFLOW_GRAPH,
            relRoute: RelativeRoutes.GRAPH,
            label: t('tabs.workflow'),
            content: (
              <GraphView
                graphUuid={workflow.graphUuid}
                publicView={publicView}
              />
            ),
            allowedTabs: [1, 2, 3, 4]
          },
          {
            type: WorkflowViewType.OUTCOME_EDIT,
            route: CFRoutes.WORKFLOW_OUTCOME_EDIT,
            relRoute: RelativeRoutes.OUTCOME_EDIT,
            label: t('tabs.outcomes'),
            content: (
              <OutcomeEditView
                graphUuid={workflow.graphUuid}
                publicView={publicView}
              />
            ),
            allowedTabs: workflow.workflowType == 'program' ? [3] : [2, 3] // @todo enum
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
          const path = generatePath(item.route, { uuid: uuid ?? '' })
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
