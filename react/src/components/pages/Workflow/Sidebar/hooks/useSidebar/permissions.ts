import {
  WorkflowType,
  WorkflowViewType
} from '@cf/components/pages/Workflow/types'
import { SidebarState } from '@cf/features/sidebar/state/sidebar.slice'

import { ConfigType } from './types'

type PermissionMatrixType = Record<
  SidebarState['tab'],
  {
    [index in WorkflowType]?: WorkflowViewType[]
  }
>

// describes where each tab exists and should be rendered
// ie, EDIT exists for
// -> ACTIVITY (workflow type)
// --> WORKFLOW and OUTCOMES (type / tab view)
const permissionMatrix: PermissionMatrixType = {
  edit: {
    [WorkflowType.ACTIVITY]: [
      WorkflowViewType.GRAPH,
      WorkflowViewType.OUTCOME_EDIT
    ],
    [WorkflowType.COURSE]: [
      WorkflowViewType.GRAPH,
      WorkflowViewType.OUTCOME_EDIT,
      WorkflowViewType.OUTCOME_ANALYTICS
    ],
    [WorkflowType.PROGRAM]: [
      WorkflowViewType.GRAPH,
      WorkflowViewType.OUTCOME_EDIT,
      WorkflowViewType.OUTCOME_ANALYTICS,
      WorkflowViewType.GRID_VIEW
    ]
  },
  add: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.GRAPH],
    [WorkflowType.COURSE]: [WorkflowViewType.GRAPH],
    [WorkflowType.PROGRAM]: [WorkflowViewType.GRAPH]
  },
  comments: {
    [WorkflowType.ACTIVITY]: [
      WorkflowViewType.GRAPH,
      WorkflowViewType.OUTCOME_EDIT
    ],
    [WorkflowType.COURSE]: [
      WorkflowViewType.GRAPH,
      WorkflowViewType.OUTCOME_EDIT
    ],
    [WorkflowType.PROGRAM]: [
      WorkflowViewType.GRAPH,
      WorkflowViewType.OUTCOME_EDIT
    ]
  },
  outcomes: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.GRAPH],
    [WorkflowType.COURSE]: [WorkflowViewType.GRAPH],
    [WorkflowType.PROGRAM]: [WorkflowViewType.GRAPH]
  },
  related: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.OUTCOME_EDIT],
    [WorkflowType.COURSE]: [WorkflowViewType.OUTCOME_EDIT]
  }
}

export function isTabVisible(
  tab: SidebarState['tab'],
  config: ConfigType
): boolean {
  const { workflowType, viewType } = config

  if (!workflowType || !viewType) {
    return false
  }

  return !!permissionMatrix[tab][workflowType as WorkflowType]?.includes(
    viewType
  )
}
