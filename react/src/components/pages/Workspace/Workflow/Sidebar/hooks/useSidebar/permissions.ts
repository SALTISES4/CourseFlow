import {
  WorkflowType,
  WorkflowViewType
} from '@cfPages/Workspace/Workflow/types'

import { ConfigType } from './types'
import { SidebarDataType } from '../../types'

type PermissionMatrixType = {
  [index in keyof SidebarDataType]: {
    [index in WorkflowType]?: WorkflowViewType[]
  }
}

// describes where each tab exists and should be rendered
// ie, EDIT
// -> exists for activity (workflow type)
// --> workflow and outcomes (workflow type view / tab)
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
  outcomes: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.WORKFLOW],
    [WorkflowType.COURSE]: [WorkflowViewType.WORKFLOW],
    [WorkflowType.PROGRAM]: [WorkflowViewType.WORKFLOW]
  },
  related: {
    [WorkflowType.ACTIVITY]: [WorkflowViewType.OUTCOME_EDIT],
    [WorkflowType.COURSE]: [WorkflowViewType.OUTCOME_EDIT]
  },
  restore: {
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
  }
}

export function isTabVisibile(
  tab: keyof SidebarDataType,
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
