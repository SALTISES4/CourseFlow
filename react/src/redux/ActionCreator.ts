import { CfObjectType } from '@cf/types/enum'
import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  OutcomeOutcomeActions,
  OutcomeWorkflowActions,
  WeekWorkflowActions
} from '@cfRedux/types/enumActions'
import { AppState } from '@cfRedux/types/type'
import { EComment } from '@XMLHTTP/types/entity'

export type WorkSpaceAppState = Pick<
  AppState,
  | 'outcomeworkflow'
  | 'outcome'
  | 'outcomenode'
  | 'outcomeoutcome'
  | 'parentWorkflow'
  | 'parentNode'
  | 'outcomehorizontallink'
  | 'childWorkflow'
  | 'tags'
> &
  AppState['workspace']

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
    objectid: string,
    objectType: CfObjectType,
    lock?: boolean,
    userId?: number,
    userColour?: string
  ) => {
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
    id: string,
    objectType: CfObjectType,
    commentData: EComment[]
  ) => {
    return {
      type: objectType + '/reloadComments', // this is a redux antipattern
      payload: {
        id: id,
        objectType: objectType,
        commentData
      }
    }
  }

  static changeField = <T>(id: string, objectType: CfObjectType, json: T) => {
    console.log(
      'what is  static changeField = (id: string, objectType: CfObjectType, json) => {'
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

  static replaceWorkspaceStoreData = (dataPackage) => {
    return {
      type: CommonActions.REPLACE_STOREDATA,
      payload: dataPackage
    }
  }

  static refreshWorkspaceStoreData = (
    dataPackage: WorkSpaceAppState
  ): { type: CommonActions; payload: WorkSpaceAppState } => {
    return {
      type: CommonActions.REFRESH_STOREDATA,
      payload: dataPackage
    }
  }

  // static reloadAssignmentsAction = (id: string, hasAssignment) => {
  //   return {
  //     type: NodeActions.RELOAD_ASSIGNMENTS,
  //     payload: { id: id, hasAssignment: hasAssignment }
  //   }
  // }

  static moveWeekWorkflow = (
    id: string,
    newIndex: number,
    newParent: number,
    childid: string
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

  static columnChangeNode = (id: string, newColumn: number) => {
    return {
      type: NodeActions.CHANGED_COLUMN,
      payload: { id, newColumn }
    }
  }

  static moveNodeWeek = (
    id: string,
    newIndex: number,
    newParent: number,
    childid: string
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
    id: string,
    newIndex: number,
    newParent: number,
    childid: string
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
    id: string,
    newIndex: number,
    newParent: number,
    childid: string
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
}

export default ActionCreator
