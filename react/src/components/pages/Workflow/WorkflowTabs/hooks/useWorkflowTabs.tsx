import { WorkflowType } from '@cf/api/gen/types.gen'
import { selectNodeUuidsByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { selectRootOutcomes } from '@cf/features/graph/state/selectors/outcomes.selectors'
import type { RootState } from '@cf/redux/store'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import {
  type WorkflowPageData,
  WorkflowViewType
} from '@cfPages/Workflow/types'
import GraphView from '@cfViews/WorkflowView/GraphView'
import OutcomeEditView from '@cfViews/WorkflowView/OutcomeEditView'
import OutcomeTableView from '@cfViews/WorkflowView/OutcomeTableView'
import OverviewView from '@cfViews/WorkflowView/OverviewView'
import Tab from '@mui/material/Tab'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Navigate,
  Route,
  generatePath,
  useNavigate,
  useParams
} from 'react-router-dom'

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
  const graphUuid = workflow?.graphUuid ?? ''
  const nodeUuidsSelector = useMemo(
    () => selectNodeUuidsByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodeUuids = useSelector(nodeUuidsSelector)
  const rootOutcomes = useSelector((state: RootState) =>
    selectRootOutcomes(state, graphUuid)
  )
  const supportsOutcomeTable =
    workflow?.workflowType === WorkflowType.COURSE ||
    workflow?.workflowType === WorkflowType.PROGRAM
  const outcomeTableEligible =
    supportsOutcomeTable && nodeUuids.length > 0 && rootOutcomes.length > 0

  const tabs: {
    type: WorkflowViewType
    route: CFRoutes
    relRoute: RelativeRoutes
    label: string
    content: ReactNode
    hidden?: boolean
    disabled?: boolean
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
            )
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
            )
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
            )
          },
          {
            type: WorkflowViewType.OUTCOME_TABLE,
            route: CFRoutes.WORKFLOW_OUTCOME_TABLE,
            relRoute: RelativeRoutes.OUTCOME_TABLE,
            label: t('tabs.outcomeTable'),
            hidden: !supportsOutcomeTable,
            disabled: !outcomeTableEligible,
            content: outcomeTableEligible ? (
              <OutcomeTableView workflow={workflow} publicView={publicView} />
            ) : (
              <Navigate
                replace
                to={generatePath(CFRoutes.WORKFLOW, { uuid: uuid ?? '' })}
              />
            )
          }
        ]

  const tabButtons = tabs
    .filter((item) => !item.hidden)
    .map((item) => (
      <Tab
        key={item.type}
        label={item.label}
        value={item.type}
        disabled={item.disabled}
        onClick={() => {
          const path = generatePath(item.route, { uuid: uuid ?? '' })
          navigate(path)
        }}
      />
    ))

  const tabRoutes = tabs.map((item, index) => (
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
