// group all actions together which are global
export enum CommonActions {
  REPLACE_STOREDATA = 'replaceStoreData',
  REFRESH_STOREDATA = 'refreshStoreData'
}

export enum WorkFlowActions {
  CREATELOCK = 'workflow/createLock',
  CHANGE_FIELD = 'workflow/changeField',
  DELETE_SELF_SOFT = 'workflow/deleteSelfSoft',
  RESTORE_SELF = 'workflow/restoreSelf'
}

export enum WeekWorkflowActions {
  WEEK_WORKFLOW__CHANGEID = 'weekworkflow/changeID',
  WEEK_WORKFLOW__MOVED_TO = 'weekworkflow/movedTo'
}

export enum WeekActions {
  DELETE_SELF = 'week/deleteSelf',
  DELETE_SELF_SOFT = 'week/deleteSelfSoft',
  RESTORE_SELF = 'week/restoreSelf',
  INSERT_BELOW = 'week/insertBelow'
}

export enum OutcomeActions {
  NEW_OUTCOME = 'outcome/newOutcome'
}

export enum OutcomeBaseActions {
  DELETE_SELF = 'outcome_base/deleteSelf',
  DELETE_SELF_SOFT = 'outcome_base/deleteSelfSoft',
  RESTORE_SELF = 'outcome_base/restoreSelf',
  INSERT_BELOW = 'outcome_base/insertBelow'
}
export enum OutcomeWorkflowActions {
  MOVED_TO = 'outcomeworkflow/movedTo',
  CHANGE_ID = 'outcomeworkflow/changeID'
}

export enum StrategyActions {
  ADD_STRATEGY = 'strategy/addStrategy'
}

export enum ColumnActions {
  // COLUMN
  DELETE_SELF = 'column/deleteSelf',
  DELETE_SELF_SOFT = 'column/deleteSelfSoft',
  RESTORE_SELF = 'column/restoreSelf',
  INSERT_BELOW = 'column/insertBelow'
}

export enum ColumnWorkflowActions {
  CHANGE_ID = 'columnworkflow/changeID',
  MOVED_TO = 'columnworkflow/movedTo'
}

export enum NodeActions {
  NEW_NODE = 'node/newNode'
}
