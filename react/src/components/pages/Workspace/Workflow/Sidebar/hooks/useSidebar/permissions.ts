import {
  WorkflowType,
  WorkflowViewType
} from '@cfPages/Workspace/Workflow/types'
import { SidebarState } from '@cfRedux/slices/sidebar.slice'

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
      WorkflowViewType.WORKFLOW,
      WorkflowViewType.OUTCOME_EDIT
    ],
    [WorkflowType.COURSE]: [
      WorkflowViewType.WORKFLOW,
      WorkflowViewType.OUTCOME_EDIT,
      WorkflowViewType.OUTCOME_ANALYTICS
    ],
    [WorkflowType.PROGRAM]: [
      WorkflowViewType.WORKFLOW,
      WorkflowViewType.OUTCOME_EDIT,
      WorkflowViewType.OUTCOME_ANALYTICS,
      WorkflowViewType.GRID_VIEW
    ]
  },
  add: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.WORKFLOW],
    [WorkflowType.COURSE]: [WorkflowViewType.WORKFLOW],
    [WorkflowType.PROGRAM]: [WorkflowViewType.WORKFLOW]
  },
  comments: {
    [WorkflowType.ACTIVITY]: [
      WorkflowViewType.WORKFLOW,
      WorkflowViewType.OUTCOME_EDIT
    ],
    [WorkflowType.COURSE]: [
      WorkflowViewType.WORKFLOW,
      WorkflowViewType.OUTCOME_EDIT
    ],
    [WorkflowType.PROGRAM]: [
      WorkflowViewType.WORKFLOW,
      WorkflowViewType.OUTCOME_EDIT
    ]
  },
  outcomes: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.WORKFLOW],
    [WorkflowType.COURSE]: [WorkflowViewType.WORKFLOW],
    [WorkflowType.PROGRAM]: [WorkflowViewType.WORKFLOW]
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
