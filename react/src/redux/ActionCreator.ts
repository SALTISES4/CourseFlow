import { CfObjectType } from '@cf/types/enum'
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
import { AppState } from '@cfRedux/types/type'

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
    objectId: number,
    objectType: CfObjectType,
    lock?: boolean,
    userId?: number,
    userColour?: string
  ) => {
    console.log('createLockAction')
    console.log(lock)

    if (lock) {
      return {
        type: objectType + '/createLock', // this is a redux antipattern
        payload: {
          id: objectId,
          // where are rest of props for lock?
          lock: { userId: userId, userColour: userColour }
        }
      }
    } else {
      return {
        type: objectType + '/createLock',
        payload: {
          id: objectId,
          lock: null
        }
      }
    }
  }

  static reloadCommentsAction = (
    id: number,
    objectType: CfObjectType,
    commentData
  ) => {
    console.log('what is commentData')
    console.log(commentData)

    return {
      type: objectType + '/reloadComments', // this is a redux antipattern
      payload: {
        id: id,
        objectType: objectType,
        commentData
      }
    }
  }

  static changeField = (id: number, objectType: CfObjectType, json) => {
    console.log(
      'what is  static changeField = (id: number, objectType: CfObjectType, json) => {'
    )
    console.log(json)
    return {
      type: objectType + '/changeField', // this is a redux antipattern
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
    console.log('what is   static replaceStoreData = (dataPackage) => {')
    console.log(dataPackage)
    return {
      type: CommonActions.REPLACE_STOREDATA,
      payload: dataPackage
    }
  }

  static refreshStoreData = (
    dataPackage: AppState
  ): { type: CommonActions; payload: AppState } => {
    return {
      type: CommonActions.REFRESH_STOREDATA,
      payload: dataPackage
    }
  }

  // static reloadAssignmentsAction = (id: number, hasAssignment) => {
  //   return {
  //     type: NodeActions.RELOAD_ASSIGNMENTS,
  //     payload: { id: id, hasAssignment: hasAssignment }
  //   }
  // }

  static moveColumnWorkflow = (
    id: number,
    newIndex: number,
    newParent: number,
    childId: number
  ) => {
    return {
      type: ColumnWorkflowActions.MOVED_TO,
      payload: {
        id,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static moveWeekWorkflow = (
    id: number,
    newIndex: number,
    newParent: number,
    childId: number
  ) => {
    return {
      type: WeekWorkflowActions.MOVED_TO,
      payload: {
        id,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static columnChangeNode = (id: number, newColumn: number) => {
    return {
      type: NodeActions.CHANGED_COLUMN,
      payload: { id, newColumn }
    }
  }

  static moveNodeWeek = (
    id: number,
    newIndex: number,
    newParent: number,
    childId: number
  ) => {
    return {
      type: NodeWeekActions.MOVED_TO,
      payload: {
        id,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static moveOutcomeOutcome = (
    id: number,
    newIndex: number,
    newParent: number,
    childId: number
  ) => {
    return {
      type: OutcomeOutcomeActions.MOVED_TO,
      payload: {
        id,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static moveOutcomeWorkflow = (
    id: number,
    newIndex: number,
    newParent: number,
    childId: number
  ) => {
    return {
      type: OutcomeWorkflowActions.MOVED_TO,
      payload: {
        id,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static gridMenuItemAdded = (responseData) => {
    console.log('what is gridMenuItemAdded = (responseData)')
    console.log(responseData)
    return {
      type: GridMenuActions.ITEM_ADDED,
      payload: responseData
    }
  }

  static toggleObjectSet = (id: number, hidden: boolean) => {
    return {
      type: ObjectSetActions.TOGGLE_OBJECT_SET,
      payload: { id: id, hidden: hidden }
    }
  }
}

export default ActionCreator
