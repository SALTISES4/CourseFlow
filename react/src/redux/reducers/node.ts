import * as Utility from '@cfUtility'
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
} from '@cfRedux/enumActions'
import { NodeType } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'
// import $ from 'jquery'

export default function nodeReducer(
  state: NodeType[] = [],
  action: AnyAction
): NodeType[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.node) return action.payload.node
      return state

    case CommonActions.REFRESH_STOREDATA:
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
              deleted_on: window.gettext('This session')
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

    case NodeActions.CHANGE_FIELD:
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

    case NodeActions.SET_LINKED_WORKFLOW:
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              linked_workflow: action.payload.linked_workflow,
              linked_workflow_data: action.payload.linked_workflow_data
            }
          : item
      )

    case NodeActions.RELOAD_ASSIGNMENTS:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, has_assignment: action.payload.has_assignment }
          : item
      )

    /*******************************************************
     * NODE LINK
     *******************************************************/
    case NodeLinkActions.DELETE_SELF:
    case NodeLinkActions.DELETE_SELF_SOFT:
      return state.map((item) => {
        if (item.outgoing_links.includes(action.payload.id)) {
          const updatedOutgoingLinks = item.outgoing_links.filter(
            (linkId) => linkId !== action.payload.id
          )
          return { ...item, outgoing_links: updatedOutgoingLinks }
        }
        return item
      })

    case NodeLinkActions.RESTORE_SELF:
      return state.map((item) => {
        if (item.id === action.payload.parent_id) {
          return {
            ...item,
            outgoing_links: [...item.outgoing_links, action.payload.id]
          }
        }
        return item
      })

    case NodeLinkActions.NEW_NODE_LINK:
      return state.map((item) => {
        if (item.id === action.payload.new_model.source_node) {
          return {
            ...item,
            outgoing_links: [
              ...item.outgoing_links,
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
              outcomenode_set: update.outcomenode_set,
              outcomenode_unique_set: update.outcomenode_unique_set
            }
          : item
      })

    case OutcomeNodeActions.UPDATE_DEGREE:
      if (action.payload.outcomenode === -1) return state
      return state.map((item) => {
        return item.id === action.payload.data_package[0].node
          ? {
              ...item,
              outcomenode_set: action.payload.new_outcomenode_set,
              outcomenode_unique_set: action.payload.new_outcomenode_unique_set
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
