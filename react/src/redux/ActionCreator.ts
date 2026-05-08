import { CfObjectType } from '@cf/types/enum'
import {
  CommonActions,
  NodeActions,
  NodeSectionActions,
  OutcomeOutcomeActions,
  OutcomeWorkflowActions,
  SectionWorkflowActions
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
    objectuuid: string,
    objectType: CfObjectType,
    lock?: boolean,
    userId?: number,
    userColour?: string
  ) => {
    if (lock) {
      return {
        type: objectType + '/createLock', // this is a redux antipattern
        payload: {
          uuid: objectId,
          // where are rest of props for lock?
          lock: { userId: userId, userColour: userColour }
        }
      }
    } else {
      return {
        type: objectType + '/createLock',
        payload: {
          uuid: objectId,
          lock: null
        }
      }
    }
  }

  static reloadCommentsAction = (
    uuid: string,
    objectType: CfObjectType,
    commentData: EComment[]
  ) => {
    return {
      type: objectType + '/reloadComments', // this is a redux antipattern
      payload: {
        uuid: id,
        objectType: objectType,
        commentData
      }
    }
  }

  static changeField = <T>(uuid: string, objectType: CfObjectType, json: T) => {
    console.log(
      'what is  static changeField = (uuid: string, objectType: CfObjectType, json) => {'
    )
    console.log(json)
    return {
      type: objectType + '/changeField', // this is a redux antipattern
      payload: {
        uuid: id,
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

  // static reloadAssignmentsAction = (uuid: string, hasAssignment) => {
  //   return {
  //     type: NodeActions.RELOAD_ASSIGNMENTS,
  //     payload: { uuid: id, hasAssignment: hasAssignment }
  //   }
  // }

  static moveSectionWorkflow = (
    uuid: string,
    newIndex: number,
    newParent: number,
    childuuid: string
  ) => {
    return {
      type: SectionWorkflowActions.MOVED_TO,
      payload: {
        uuid,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static columnChangeNode = (uuid: string, newColumn: number) => {
    return {
      type: NodeActions.CHANGED_COLUMN,
      payload: { id, newColumn }
    }
  }

  static moveNodeSection = (
    uuid: string,
    newIndex: number,
    newParent: number,
    childuuid: string
  ) => {
    return {
      type: NodeSectionActions.MOVED_TO,
      payload: {
        uuid,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static moveOutcomeOutcome = (
    uuid: string,
    newIndex: number,
    newParent: number,
    childuuid: string
  ) => {
    return {
      type: OutcomeOutcomeActions.MOVED_TO,
      payload: {
        uuid,
        newIndex,
        newParent,
        childId
      }
    }
  }

  static moveOutcomeWorkflow = (
    uuid: string,
    newIndex: number,
    newParent: number,
    childuuid: string
  ) => {
    return {
      type: OutcomeWorkflowActions.MOVED_TO,
      payload: {
        uuid,
        newIndex,
        newParent,
        childId
      }
    }
  }
}

export default ActionCreator
