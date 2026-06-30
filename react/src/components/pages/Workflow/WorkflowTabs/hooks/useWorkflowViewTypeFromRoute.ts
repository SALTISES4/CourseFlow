import { CFRoutes } from '@cf/router/appRoutes'
import { WorkflowViewType } from '@cfPages/Workflow/types'
import { matchPath, useLocation } from 'react-router-dom'

/**
 * Maps absolute workflow route templates to tabs (most specific paths first).
 * Keep aligned with `useWorkflowTabs` route constants.
 */
const WORKFLOW_ROUTE_TO_VIEW_TYPE: ReadonlyArray<{
  routePath:
    | typeof CFRoutes.WORKFLOW
    | typeof CFRoutes.WORKFLOW_GRAPH
    | typeof CFRoutes.WORKFLOW_OUTCOME_EDIT
  viewType: WorkflowViewType
}> = [
  {
    routePath: CFRoutes.WORKFLOW_GRAPH,
    viewType: WorkflowViewType.GRAPH
  },
  {
    routePath: CFRoutes.WORKFLOW_OUTCOME_EDIT,
    viewType: WorkflowViewType.OUTCOME_EDIT
  },
  {
    routePath: CFRoutes.WORKFLOW,
    viewType: WorkflowViewType.OVERVIEW
  }
]

/** Current workflow workspace tab from `/workflow/:uuid/*` pathname. */
export function useWorkflowViewTypeFromRoute(): WorkflowViewType {
  const { pathname } = useLocation()

  for (const { routePath, viewType } of WORKFLOW_ROUTE_TO_VIEW_TYPE) {
    const match = matchPath({ path: routePath, end: true }, pathname)
    if (match) {
      return viewType
    }
  }

  return WorkflowViewType.OVERVIEW
}
