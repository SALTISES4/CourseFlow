import { ConfigType, ViewType, WorkflowType } from './types'
import { SidebarDataType } from '../../types'

type PermissionMatrixType = {
  [index in keyof SidebarDataType]: {
    [index in WorkflowType]?: ViewType[]
  }
}

// describes where each tab exists and should be rendered
// ie, EDIT
// -> exists for activity (workflow type)
// --> workflow and outcomes (workflow type view / tab)
const permissionMatrix: PermissionMatrixType = {
  edit: {
    [WorkflowType.ACTIVITY]: [ViewType.WORKFLOW, ViewType.OUTCOMES],
    [WorkflowType.COURSE]: [
      ViewType.WORKFLOW,
      ViewType.OUTCOMES,
      ViewType.OUTCOME_ANALYTICS
    ],
    [WorkflowType.PROGRAM]: [
      ViewType.WORKFLOW,
      ViewType.OUTCOMES,
      ViewType.OUTCOME_ANALYTICS,
      ViewType.GRID_VIEW
    ]
  },
  add: {
    [WorkflowType.ACTIVITY]: [ViewType.WORKFLOW],
    [WorkflowType.COURSE]: [ViewType.WORKFLOW],
    [WorkflowType.PROGRAM]: [ViewType.WORKFLOW]
  },
  outcomes: {
    [WorkflowType.ACTIVITY]: [ViewType.WORKFLOW],
    [WorkflowType.COURSE]: [ViewType.WORKFLOW],
    [WorkflowType.PROGRAM]: [ViewType.WORKFLOW]
  },
  related: {
    [WorkflowType.ACTIVITY]: [ViewType.OUTCOMES],
    [WorkflowType.COURSE]: [ViewType.OUTCOMES]
  },
  restore: {
    [WorkflowType.ACTIVITY]: [ViewType.WORKFLOW, ViewType.OUTCOMES],
    [WorkflowType.COURSE]: [ViewType.WORKFLOW, ViewType.OUTCOMES],
    [WorkflowType.PROGRAM]: [ViewType.WORKFLOW, ViewType.OUTCOMES]
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
