import {
  ColumnWorkflowActions,
  CommonActions,
  GridMenuActions,
  NodeActions,
  NodeWeekActions,
  ObjectSetActions,
  OutcomeOutcomeActions,
  OutcomeWorkflowActions,
  WeekWorkflowActions
} from '@cfRedux/types/enumActions'

/**
 *  local action creators
 *  grouped these in a class of static methods for now, provably doesn't make sense long term
 *  leave as is till python 'actions' are sorted out and then regroup by domain
 */
class ActionCreator {
  /*******************************************************
   * COMMON / DYNAMIC OBJECT
   *******************************************************/
  static createLockAction = (
    objectId,
    objectType,
    lock?,
    userId?,
    userColour?
  ) => {
    if (lock)
      return {
        type: objectType + '/createLock',
        payload: {
          id: objectId,
          lock: { userId: userId, userColour: userColour }
        }
      }
    else
      return {
        type: objectType + '/createLock',
        payload: {
          id: objectId,
          lock: null
        }
      }
  }

  static reloadCommentsAction = (id, objectType, comment_data) => {
    return {
      type: objectType + '/reloadComments',
      payload: {
        id: id,
        objectType: objectType,
        comment_data
      }
    }
  }

  static changeField = (id, objectType, json) => {
    return {
      type: objectType + '/changeField',
      payload: {
        id: id,
        objectType: objectType,
        json: json
      }
    }
  }

  /*******************************************************
   *
   *******************************************************/
  // Define a specific action to clear the workflow data
  static clearWorkflowData = () => ({
    type: CommonActions.CLEAR_WORKFLOW_DATA
  })

  static replaceStoreData = (dataPackage) => {
    return {
      type: CommonActions.REPLACE_STOREDATA,
      payload: dataPackage
    }
  }

  static refreshStoreData = (dataPackage) => {
    return {
      type: CommonActions.REFRESH_STOREDATA,
      payload: dataPackage
    }
  }

  static reloadAssignmentsAction = (id, hasAssignment) => {
    return {
      type: NodeActions.RELOAD_ASSIGNMENTS,
      payload: { id: id, hasAssignment: hasAssignment }
    }
  }

  static moveColumnWorkflow = (id, new_position, new_parent, child_id) => {
    return {
      type: ColumnWorkflowActions.MOVED_TO,
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static moveWeekWorkflow = (id, new_position, new_parent, child_id) => {
    return {
      type: WeekWorkflowActions.MOVED_TO,
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static columnChangeNode = (id, new_column) => {
    return {
      type: NodeActions.CHANGED_COLUMN,
      payload: { id: id, new_column: new_column }
    }
  }

  static moveNodeWeek = (id, new_position, new_parent, child_id) => {
    return {
      type: NodeWeekActions.MOVED_TO,
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static moveOutcomeOutcome = (id, new_position, new_parent, child_id) => {
    return {
      type: OutcomeOutcomeActions.MOVED_TO,
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static moveOutcomeWorkflow = (id, new_position, new_parent, child_id) => {
    return {
      type: OutcomeWorkflowActions.MOVED_TO,
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static gridMenuItemAdded = (responseData) => {
    return {
      type: GridMenuActions.ITEM_ADDED,
      payload: responseData
    }
  }

  static toggleObjectSet = (id, hidden) => {
    return {
      type: ObjectSetActions.TOGGLE_OBJECT_SET,
      payload: { id: id, hidden: hidden }
    }
  }
}

export default ActionCreator
