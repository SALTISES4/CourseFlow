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
  CHANGE_ID = 'weekworkflow/changeID',
  MOVED_TO = 'weekworkflow/movedTo'
}

export enum WeekActions {
  DELETE_SELF = 'week/deleteSelf',
  DELETE_SELF_SOFT = 'week/deleteSelfSoft',
  RESTORE_SELF = 'week/restoreSelf',
  INSERT_BELOW = 'week/insertBelow',
  CREATE_LOCK = 'week/createLock',
  CHANGE_FIELD = 'week/changeField',
  RELOAD_COMMENTS = 'week/reloadComments'
}

export enum OutcomeActions {
  NEW_OUTCOME = 'outcome/newOutcome',
  DELETE_SELF = 'outcome/deleteSelf',
  DELETE_SELF_SOFT = 'outcome/deleteSelfSoft',
  RESTORE_SELF = 'outcome/restoreSelf'
}

export enum OutcomeNodeActions {
  UPDATE_DEGREE = 'outcomenode/updateDegree'
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
  ADD_STRATEGY = 'strategy/addStrategy',
  TOGGLE_STRATEGY = 'strategy/toggleStrategy'
}

export enum ColumnActions {
  DELETE_SELF = 'column/deleteSelf',
  DELETE_SELF_SOFT = 'column/deleteSelfSoft',
  RESTORE_SELF = 'column/restoreSelf',
  INSERT_BELOW = 'column/insertBelow'
}

export enum ColumnWorkflowActions {
  CHANGE_ID = 'columnworkflow/changeID',
  MOVED_TO = 'columnworkflow/movedTo'
}

export enum NodeWeekActions {
  CHANGE_ID = 'nodeweek/changeID',
  MOVED_TO = 'nodeweek/movedTo'
}

export enum NodeActions {
  NEW_NODE = 'node/newNode',
  DELETE_SELF = 'node/deleteSelf',
  DELETE_SELF_SOFT = 'node/deleteSelfSoft',
  RESTORE_SELF = 'node/restoreSelf',
  INSERT_BELOW = 'node/insertBelow'
}

export enum GridMenuActions {
  ITEM_ADDED = 'gridmenu/itemAdded'
}
