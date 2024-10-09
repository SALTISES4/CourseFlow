import { _t } from '@cf/utility/utilityFunctions'
import {
  ColumnActions,
  CommonActions,
  NodeActions,
  NodeLinkActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions,
  OutcomeOutcomeActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNode } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import { AnyAction } from '@reduxjs/toolkit'
// import $ from 'jquery'

export default function nodeReducer(
  state: TNode[] = [],
  action: AnyAction
): TNode[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.node) return action.payload.node
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
     * COLUMN
     *******************************************************/
    case ColumnActions.DELETE_SELF:
    case ColumnActions.DELETE_SELF_SOFT:
    case ColumnActions.RESTORE_SELF: {
      const isDeleteAction =
        action.type === ColumnActions.DELETE_SELF ||
        action.type === 'column/deleteSelfSoft'
      const newColumn = isDeleteAction
        ? action.payload.extra_data
        : action.payload.id
      const updatedState = state.map((item) => {
        const shouldUpdateColumn = isDeleteAction
          ? item.column === action.payload.id
          : action.payload.extra_data.includes(item.id)
        return shouldUpdateColumn ? { ...item, column: newColumn } : item
      })
      // @todo need to remove these kind of side effects from...
      Utility.triggerHandlerEach($('.week .node'), 'component-updated')
      return updatedState
    }

    /*******************************************************
     * NODE
     *******************************************************/
    case NodeActions.CHANGED_COLUMN:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, column: action.payload.new_column }
          : item
      )

    case NodeActions.DELETE_SELF: {
      Utility.triggerHandlerEach($('.week .node'), 'component-updated')
      return state.filter((item) => item.id !== action.payload.id)
    }

    case NodeActions.CREATE_LOCK:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, lock: action.payload.lock }
          : item
      )

    case NodeActions.DELETE_SELF_SOFT: {
      Utility.triggerHandlerEach($('.week .node'), 'component-updated')
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              deleted: true,
              deletedOn: _t('This session')
            }
          : item
      )
    }

    case NodeActions.RESTORE_SELF:
      Utility.triggerHandlerEach($('.week .node'), 'component-updated')
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, deleted: false } : item
      )

    case NodeActions.INSERT_BELOW:
    case NodeActions.NEW_NODE: {
      return [...state, action.payload.new_model]
    }

    case NodeActions.changeField:
      if (
        action.payload.changeFieldID ===
        // @ts-ignore
        COURSEFLOW_APP.contextData.changeFieldID
      ) {
        return state
      }
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.json }
          : item
      )

    case NodeActions.RELOAD_COMMENTS:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, comments: action.payload.comment_data }
          : item
      )

    case NodeActions.SET_linkedWorkflow:
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              linkedWorkflow: action.payload.linkedWorkflow,
              linkedWorkflowData: action.payload.linkedWorkflowData
            }
          : item
      )

    case NodeActions.RELOAD_ASSIGNMENTS:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, hasAssignment: action.payload.hasAssignment }
          : item
      )

    /*******************************************************
     * NODE LINK
     *******************************************************/
    case NodeLinkActions.DELETE_SELF:
    case NodeLinkActions.DELETE_SELF_SOFT:
      return state.map((item) => {
        if (item.outgoingLinks.includes(action.payload.id)) {
          const updatedOutgoingLinks = item.outgoingLinks.filter(
            (linkId) => linkId !== action.payload.id
          )
          return { ...item, outgoingLinks: updatedOutgoingLinks }
        }
        return item
      })

    case NodeLinkActions.RESTORE_SELF:
      return state.map((item) => {
        if (item.id === action.payload.parent_id) {
          return {
            ...item,
            outgoingLinks: [...item.outgoingLinks, action.payload.id]
          }
        }
        return item
      })

    case NodeLinkActions.NEW_NODE_LINK:
      return state.map((item) => {
        if (item.id === action.payload.new_model.sourceNode) {
          return {
            ...item,
            outgoingLinks: [
              ...item.outgoingLinks,
              action.payload.new_model.id
            ]
          }
        }
        return item
      })

    case StrategyActions.ADD_STRATEGY: {
      if (action.payload.nodes_added.length == 0) return state
      return [...state, ...action.payload.nodes_added]
    }
    /*******************************************************
     * OUTCOME
     *******************************************************/
    case OutcomeActions.DELETE_SELF:
    case OutcomeActions.DELETE_SELF_SOFT:
    case OutcomeActions.RESTORE_SELF:
    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT:
    case OutcomeBaseActions.RESTORE_SELF:
      return state.map((item) => {
        const update = action.payload.extra_data.find(
          (updateItem) => updateItem.id === item.id
        )
        return update ? { ...item, ...update } : item
      })

    case OutcomeActions.INSERT_CHILD:
    case OutcomeActions.INSERT_BELOW:
    case OutcomeBaseActions.INSERT_CHILD:
    case OutcomeOutcomeActions.CHANGE_ID:
      if (action.payload.node_updates.length === 0) return state
      return state.map((item) => {
        const update = action.payload.node_updates.find(
          (updateItem) => updateItem.id === item.id
        )
        return update
          ? {
              ...item,
              outcomenodeSet: update.outcomenodeSet,
              outcomenodeUniqueSet: update.outcomenodeUniqueSet
            }
          : item
      })

    case OutcomeNodeActions.UPDATE_DEGREE:
      if (action.payload.outcomenode === -1) return state
      return state.map((item) => {
        return item.id === action.payload.dataPackage[0].node
          ? {
              ...item,
              outcomenodeSet: action.payload.new_outcomenodeSet,
              outcomenodeUniqueSet: action.payload.new_outcomenodeUniqueSet
            }
          : item
      })

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
