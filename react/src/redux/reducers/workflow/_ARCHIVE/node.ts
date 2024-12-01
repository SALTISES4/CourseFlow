import { CfLock } from '@cf/types/common'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import nodeSliceOld, {
  changeField,
  changedColumn,
  createLock
} from '@cfRedux/slices/node.slice.old'
import {
  ColumnActions,
  CommonActions,
  NodeActions,
  NodelinkActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions,
  OutcomeOutcomeActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNode } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

// import $ from 'jquery'

/*******************************************************
 * TYPES FOR STORE
 *******************************************************/
interface GenericNodeAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA | CommonActions.REFRESH_STOREDATA
  payload: { node?: TNode[] }
}

// Column Actions
interface DeleteColumnAction extends AnyAction {
  type:
    | ColumnActions.DELETE_SELF
    | ColumnActions.DELETE_SELF_SOFT
    | ColumnActions.RESTORE_SELF
  payload: { id: number; extraData: any }
}

// Node Actions
interface ChangeColumnAction extends AnyAction {
  type: NodeActions.CHANGED_COLUMN
  payload: { id: number; newColumn: number }
}

interface DeleteNodeAction extends AnyAction {
  type: NodeActions.DELETE_SELF
  payload: { id: number }
}

interface DeleteSoftNodeAction extends AnyAction {
  type: NodeActions.DELETE_SELF_SOFT
  payload: { id: number }
}

interface CreateLockNodeAction extends AnyAction {
  type: //
  | NodeActions.CREATE_LOCK
    | NodeActions.RESTORE_SELF
    | NodeActions.NEW_NODE
    | NodeActions.INSERT_BELOW
    | NodeActions.CHANGE_FIELD
    | NodeActions.RELOAD_COMMENTS
    | NodeActions.SET_LINKED_WORKFLOW
  payload: { id: number; lock: CfLock }
}
//
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.RESTORE_SELF
//   payload: { id: number; lock: boolean }
// }
//
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.INSERT_BELOW
//   payload: { id: number; lock: boolean }
// }
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.NEW_NODE
//   payload: { id: number; lock: boolean }
// }
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.changeField
//   payload: { id: number; lock: boolean }
// }
//
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.RELOAD_COMMENTS
//   payload: { id: number; lock: boolean }
// }
//
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.RELOAD_ASSIGNMENTS
//   payload: { id: number; lock: boolean }
// }
//
// interface CreateLockNodeAction extends AnyAction {
//   type: NodeActions.RELOAD_COMMENTS
//   payload: { id: number; lock: boolean }
// }

// Node Link Actions
interface DeleteNodelinkAction extends AnyAction {
  type: NodelinkActions.DELETE_SELF | NodelinkActions.DELETE_SELF_SOFT
  payload: { id: number }
}

interface CreateNodelinkAction extends AnyAction {
  type: NodelinkActions.NEW_NODE_LINK
  payload: { id: number }
}

interface RestoreNodelinkAction extends AnyAction {
  type: NodelinkActions.RESTORE_SELF
  payload: { parentId: number; id: number }
}

// Strategy Actions
interface AddStrategyAction extends AnyAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { nodesAdded: TNode[] }
}

// Outcome Actions
interface DeleteOutcomeAction extends AnyAction {
  type:
    | OutcomeActions.DELETE_SELF
    | OutcomeActions.DELETE_SELF_SOFT
    | OutcomeActions.RESTORE_SELF
    | OutcomeBaseActions.DELETE_SELF
    | OutcomeBaseActions.DELETE_SELF_SOFT
    | OutcomeBaseActions.RESTORE_SELF
  payload: { extraData: any[] }
}

interface CreateOutcomeAction extends AnyAction {
  type:
    | OutcomeActions.INSERT_CHILD
    | OutcomeActions.INSERT_BELOW
    | OutcomeBaseActions.INSERT_CHILD
    | OutcomeOutcomeActions.CHANGE_ID
  payload: { extraData: any[] }
}

interface OutcomeNodeAction extends AnyAction {
  type: OutcomeNodeActions.UPDATE_DEGREE
  payload: { extraData: any[] }
}

interface CreateWeekAction extends AnyAction {
  type: WeekActions.INSERT_BELOW
  payload: { extraData: any[] }
}

type NodeActionsUnion =
  | GenericNodeAction
  | DeleteColumnAction
  | ChangeColumnAction
  | DeleteNodeAction
  | DeleteSoftNodeAction
  | DeleteSoftNodeAction
  | CreateLockNodeAction
  | DeleteNodelinkAction
  | RestoreNodelinkAction
  | AddStrategyAction
  | DeleteOutcomeAction
  | OutcomeNodeAction
  | CreateWeekAction
  | CreateOutcomeAction
  | CreateNodelinkAction

export default function nodeReducer(
  state: TNode[] = [],
  action: NodeActionsUnion
): TNode[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.node) {
        return action.payload.node
      }
      return state

    case CommonActions.REFRESH_STOREDATA: {
      const updatedState = [...state]

      if (action.payload.node) {
        action.payload.node.forEach((nodeItem) => {
          const existingIndex = updatedState.findIndex(
            (item) => item.id === nodeItem.id
          )
          if (existingIndex >= 0) {
            updatedState[existingIndex] = nodeItem
          } else {
            updatedState.push(nodeItem)
          }
        })
      }
      return updatedState
    }

    /*******************************************************
     * NODE
     *******************************************************/

    // UPDATE_NODE is probably fine
    // case NodeActions.CHANGED_COLUMN:
    //   return nodeSlice.reducer(state, changedColumn(action.payload))

    // case NodeActions.CREATE_LOCK:
    //   return nodeSlice.reducer(state, createLock(action.payload))
    //
    // case NodeActions.CHANGE_FIELD:
    //   return nodeSlice.reducer(state, changeField(action.payload))

    // there is no need to check whether node exists in store here
    // case NodeActions.DELETE_SELF: {
    //   // @todo no
    //   ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    //
    //   return state.filter((item) => item.id !== action.payload.id)
    // }

    // case NodeActions.DELETE_SELF_SOFT: {
    //   // @todo no
    //   ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    //
    //   return state.map((item) => {
    //     if (item.id === action.payload.id) {
    //       return {
    //         ...item,
    //         deleted: true,
    //         deletedOn: _t('This session')
    //       }
    //     }
    //
    //     return item
    //   })
    // }

    // case NodeActions.RESTORE_SELF:
    //   // @todo no
    //   ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    //
    //   return state.map((item) => {
    //     if (item.id === action.payload.id) {
    //       return { ...item, deleted: false }
    //     }
    //     return item
    //   })

    // case NodeActions.INSERT_BELOW:
    // case NodeActions.NEW_NODE: {
    //   return [...state, action.payload.newModel]
    // }

    // case NodeActions.RELOAD_COMMENTS:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? { ...item, comments: action.payload.commentData }
    //       : item
    //   )

    // case NodeActions.SET_LINKED_WORKFLOW:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? {
    //           ...item,
    //           linkedWorkflow: action.payload.linkedWorkflow,
    //           linkedWorkflowData: action.payload.linkedWorkflowData
    //         }
    //       : item
    //   )

    // case NodeActions.RELOAD_ASSIGNMENTS:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? { ...item, hasAssignment: action.payload.hasAssignment }
    //       : item
    //   )

    /*******************************************************
     * NODE LINK
     *******************************************************/
    // case NodelinkActions.DELETE_SELF:
    // case NodelinkActions.DELETE_SELF_SOFT:
    //   return state.map((item) => {
    //     if (item.outgoingLinks.includes(action.payload.id)) {
    //       const updatedOutgoingLinks = item.outgoingLinks.filter(
    //         (linkId) => linkId !== action.payload.id
    //       )
    //       return { ...item, outgoingLinks: updatedOutgoingLinks }
    //     }
    //     return item
    //   })

    // case NodelinkActions.RESTORE_SELF:
    //   return state.map((item) => {
    //     if (item.id === action.payload.parentId) {
    //       return {
    //         ...item,
    //         outgoingLinks: [...item.outgoingLinks, action.payload.id]
    //       }
    //     }
    //     return item
    //   })

    // case NodelinkActions.NEW_NODE_LINK:
    //   return state.map((item) => {
    //     if (item.id === action.payload.newModel.sourceNode) {
    //       return {
    //         ...item,
    //         outgoingLinks: [...item.outgoingLinks, action.payload.newModel.id]
    //       }
    //     }
    //     return item
    //   })

    case StrategyActions.ADD_STRATEGY: {
      if (action.payload.nodesAdded.length == 0) {
        return state
      }
      return [...state, ...action.payload.nodesAdded]
    }
    /*******************************************************
     * OUTCOME
     *******************************************************/
    // case OutcomeActions.DELETE_SELF:
    // case OutcomeActions.DELETE_SELF_SOFT:
    // case OutcomeActions.RESTORE_SELF:
    // case OutcomeBaseActions.DELETE_SELF:
    // case OutcomeBaseActions.DELETE_SELF_SOFT:
    // case OutcomeBaseActions.RESTORE_SELF:
    //   return state.map((item) => {
    //     const update = action.payload.extraData.find(
    //       (updateItem) => updateItem.id === item.id
    //     )
    //     return update ? { ...item, ...update } : item
    //   })

    // case OutcomeActions.INSERT_CHILD:
    // case OutcomeActions.INSERT_BELOW:
    // case OutcomeBaseActions.INSERT_CHILD:
    // case OutcomeOutcomeActions.CHANGE_ID:
    //   if (action.payload.nodeUpdates.length === 0) {
    //     return state
    //   }
    //   return state.map((item) => {
    //     const update = action.payload.nodeUpdates.find(
    //       (updateItem) => updateItem.id === item.id
    //     )
    //     return update
    //       ? {
    //           ...item,
    //           outcomenodeSet: update.outcomenodeSet,
    //           outcomenodeUniqueSet: update.outcomenodeUniqueSet
    //         }
    //       : item
    //   })

    // case OutcomeNodeActions.UPDATE_DEGREE:
    //   if (action.payload.outcomenode === -1) {
    //     return state
    //   }
    //   return state.map((item) => {
    //     return item.id === action.payload.dataPackage[0].node
    //       ? {
    //           ...item,
    //           outcomenodeSet: action.payload.newOutcomenodeSet,
    //           outcomenodeUniqueSet: action.payload.newOutcomenodeUniqueSet
    //         }
    //       : item
    //   })

    /*******************************************************
     * COLUMN
     *******************************************************/
    // case ColumnActions.DELETE_SELF:
    // case ColumnActions.DELETE_SELF_SOFT:
    // case ColumnActions.RESTORE_SELF: {
    //   const isDeleteAction =
    //     action.type === ColumnActions.DELETE_SELF ||
    //     action.type === ColumnActions.DELETE_SELF_SOFT
    //   const newColumn = isDeleteAction
    //     ? action.payload.extraData
    //     : action.payload.id
    //   const updatedState = state.map((item) => {
    //     const shouldUpdateColumn = isDeleteAction
    //       ? item.column === action.payload.id
    //       : action.payload.extraData.includes(item.id)
    //     return shouldUpdateColumn ? { ...item, column: newColumn } : item
    //   })

    //   // @todo need to remove these kind of side effects from...
    //   ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    //
    //   return updatedState
    // }

    /*******************************************************
     * WEEK
     *******************************************************/
    case WeekActions.INSERT_BELOW:
      if (!action.payload.children) {
        return state
      }
      return state.concat(action.payload.children.node)

    default:
      return state
  }
}
