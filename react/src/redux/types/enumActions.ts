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

export enum WeekActions {
  DELETE_SELF = 'week/deleteSelf',
  DELETE_SELF_SOFT = 'week/deleteSelfSoft',
  RESTORE_SELF = 'week/restoreSelf',
  INSERT_BELOW = 'week/insertBelow',
  CREATE_LOCK = 'week/createLock',
  CHANGE_FIELD = 'week/changeField',
  RELOAD_COMMENTS = 'week/reloadComments'
}

export enum WeekWorkflowActions {
  CHANGE_ID = 'weekworkflow/changeID',
  MOVED_TO = 'weekworkflow/movedTo'
}

export enum OutcomeActions {
  NEW_OUTCOME = 'outcome/newOutcome',
  DELETE_SELF = 'outcome/deleteSelf',
  DELETE_SELF_SOFT = 'outcome/deleteSelfSoft',
  RESTORE_SELF = 'outcome/restoreSelf',
  INSERT_CHILD = 'outcome/insertChild',
  INSERT_BELOW = 'outcome/insertBelow',
  CREATE_LOCK = 'outcome/createLock',
  RELOAD_COMMENTS = 'outcome/reloadComments',
  UPDATE_HORIZONTAL_LINK = 'outcome/updateHorizontalLinks',
  CHANGE_FIELD = 'outcome/changeField',
  CHANGE_FIELD_MANY = 'outcome/changeFieldMany'
}

export enum OutcomeNodeActions {
  UPDATE_DEGREE = 'outcomenode/updateDegree'
}

export enum OutcomeBaseActions {
  DELETE_SELF = 'outcome_base/deleteSelf',
  DELETE_SELF_SOFT = 'outcome_base/deleteSelfSoft',
  RESTORE_SELF = 'outcome_base/restoreSelf',
  INSERT_BELOW = 'outcome_base/insertBelow',
  INSERT_CHILD = 'outcome_base/insertChild',
  RELOAD_COMMENTS = 'outcome_base/reloadComments',
  CHANGE_FIELD = 'outcome_base/changeField',
  CHANGE_FIELD_MANY = 'outcome_base/changeFieldMany'
}

export enum OutcomeWorkflowActions {
  MOVED_TO = 'outcomeworkflow/movedTo',
  CHANGE_ID = 'outcomeworkflow/changeID'
}

export enum OutcomeOutcomeActions {
  CHANGE_ID = 'outcomeoutcome/changeID',
  MOVED_TO = 'outcomeoutcome/movedTo'
}

export enum StrategyActions {
  ADD_STRATEGY = 'strategy/addStrategy',
  TOGGLE_STRATEGY = 'strategy/toggleStrategy'
}

export enum ColumnActions {
  DELETE_SELF = 'column/deleteSelf',
  DELETE_SELF_SOFT = 'column/deleteSelfSoft',
  RESTORE_SELF = 'column/restoreSelf',
  INSERT_BELOW = 'column/insertBelow',
  CREATE_LOCK = 'column/createLock',
  RELOAD_COMMENTS = 'column/reloadComments',
  CHANGE_FIELD = 'column/changeField'
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
  RELOAD_ASSIGNMENTS = 'node/reloadAssignments',
  CHANGED_COLUMN = 'node/changedColumn',
  CREATE_LOCK = 'node/createLock',
  INSERT_BELOW = 'node/insertBelow',
  CHANGE_FIELD = 'node/changeField',
  RELOAD_COMMENTS = 'node/reloadComments',
  SET_LINKED_WORKFLOW = 'node/setLinkedWorkflow'
}

export enum NodeLinkActions {
  CREATE_LOCK = 'nodelink/createLock',
  CHANGE_FIELD = 'nodelink/changeField',
  RESTORE_SELF = 'nodelink/restoreSelf',
  DELETE_SELF = 'nodelink/deleteSelf',
  DELETE_SELF_SOFT = 'nodelink/deleteSelfSoft',
  NEW_NODE_LINK = 'nodelink/newNodeLink'
}

export enum GridMenuActions {
  ITEM_ADDED = 'gridmenu/itemAdded'
}

export enum ObjectSetActions {
  TOGGLE_OBJECT_SET = 'objectset/toggleObjectSet'
}

export enum OutcomeHorizontalLinkActions {
  UPDATE_DEGREE = 'outcomehorizontallink/updateDegree'
}
