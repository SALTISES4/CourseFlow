/*******************************************************
 * Workflow detail fields shared by authenticated and anonymous presentation.
 *******************************************************/
import type {
  PublicWorkflowDetailOut,
  WorkflowDetailOut
} from '@cf/api/gen/types.gen'

export type WorkflowPageData = WorkflowDetailOut | PublicWorkflowDetailOut

export function isAuthenticatedWorkflow(
  workflow: WorkflowPageData
): workflow is WorkflowDetailOut {
  return 'publicLinkEnabled' in workflow
}

/*******************************************************
 * // corresponds to the different presentation layers of the workspace
 * // see workspace tabs, they are matched (for now)
 * // WorkflowViewType additionally is one dimension which informs the workspace utility sidebar
 *******************************************************/
export enum WorkflowViewType {
  OVERVIEW = 'workflowoverview',
  GRAPH = 'graphview',
  OUTCOME_EDIT = 'outcomeedit',
  GRID_VIEW = 'grid',
  OUTCOME_TABLE = 'outcometable',
  OUTCOME_ANALYTICS = 'alignmentanalysis',
  HORIZONTAL_OUTCOME_TABLE = 'horizontaloutcometable'
}
