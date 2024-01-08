// @ts-ignore

/**
 *  local action creators
 *  grouped these in a class of static methods for now, provably doesn't make sense long term
 *  leave as is till python 'actions' are sorted out and then regroup by domain
 */
class ActionCreator {
  static createLockAction = (
    object_id,
    object_type,
    lock,
    user_id,
    user_colour
  ) => {
    if (lock)
      return {
        type: object_type + '/createLock',
        payload: {
          id: object_id,
          lock: { user_id: user_id, user_colour: user_colour }
        }
      }
    else
      return {
        type: object_type + '/createLock',
        payload: { id: object_id, lock: null }
      }
  }

  static reloadCommentsAction = (id, objectType, comment_data) => {
    return {
      type: objectType + '/reloadComments',
      payload: { id: id, objectType: objectType, comment_data }
    }
  }

  static reloadAssignmentsAction = (id, has_assignment) => {
    return {
      type: 'node/reloadAssignments',
      payload: { id: id, has_assignment: has_assignment }
    }
  }

  static moveColumnWorkflow = (id, new_position, new_parent, child_id) => {
    return {
      type: 'columnworkflow/movedTo',
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
      type: 'weekworkflow/movedTo',
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
      type: 'node/changedColumn',
      payload: { id: id, new_column: new_column }
    }
  }

  static moveNodeWeek = (id, new_position, new_parent, child_id) => {
    return {
      type: 'nodeweek/movedTo',
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static changeField = (id, objectType, json) => {
    return {
      type: objectType + '/changeField',
      payload: { id: id, objectType: objectType, json: json }
    }
  }

  static moveOutcomeOutcome = (id, new_position, new_parent, child_id) => {
    return {
      type: 'outcomeoutcome/movedTo',
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
      type: 'outcomeworkflow/movedTo',
      payload: {
        id: id,
        new_index: new_position,
        new_parent: new_parent,
        child_id: child_id
      }
    }
  }

  static gridMenuItemAdded = (response_data) => {
    return {
      type: 'gridmenu/itemAdded',
      payload: response_data
    }
  }

  static toggleObjectSet = (id, hidden) => {
    return {
      type: 'objectset/toggleObjectSet',
      payload: { id: id, hidden: hidden }
    }
  }

  static replaceStoreData = (data_package) => {
    return {
      type: 'replaceStoreData',
      payload: data_package
    }
  }

  static refreshStoreData = (data_package) => {
    return {
      type: 'refreshStoreData',
      payload: data_package
    }
  }
}
