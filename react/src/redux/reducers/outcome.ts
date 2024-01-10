// @ts-nocheck
import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeHorizontalLinkActions,
  OutcomeOutcomeActions
} from '@cfRedux/enumActions'
import { Outcome } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

/*******************************************************
 * HELPERS
 *******************************************************/
const findAndReplaceOrAdd = (array, newItem) => {
  const index = array.findIndex((item) => item.id === newItem.id)
  if (index !== -1) {
    return [...array.slice(0, index), newItem, ...array.slice(index + 1)]
  }
  return [...array, newItem]
}

const updateStateForId = (state, action, updateCallback) => {
  return state.map((item) =>
    item.id === action.payload.id ? updateCallback(item) : item
  )
}

const findParentIndices = (state, action) => {
  let oldParentIndex, newParentIndex
  const oldParent = state.find((item, index) => {
    if (item.child_outcome_links.includes(action.payload.id)) {
      oldParentIndex = index
      return true
    }
    return false
  })

  const newParent = state.find((item, index) => {
    if (item.id === action.payload.new_parent) {
      newParentIndex = index
      return true
    }
    return false
  })

  return { oldParent, oldParentIndex, newParent, newParentIndex }
}

/**
 *
 * @param state
 * @param action
 */
export default function outcomeReducer(
  state: Outcome[] = [],
  action: AnyAction
): Outcome[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA: {
      return action.payload.outcome || state
    }

    case CommonActions.REFRESH_STOREDATA: {
      return action.payload.outcome
        ? action.payload.outcome.reduce(findAndReplaceOrAdd, [...state])
        : state
    }

    /*******************************************************
     * OUTCOME
     *******************************************************/
    case OutcomeActions.CREATE_LOCK: {
      return updateStateForId(state, action, (item) => ({
        ...item,
        lock: action.payload.lock
      }))
    }

    case OutcomeActions.RESTORE_SELF:
      return updateStateForId(state, action, (item) => {
        if (item.id === action.payload.parent_id) {
          const newChildLinks = [...item.child_outcome_links]
          newChildLinks.splice(
            action.payload.throughparent_index,
            0,
            action.payload.throughparent_id
          )
          return { ...item, child_outcome_links: newChildLinks }
        }
        return item.id === action.payload.id
          ? { ...item, deleted: false }
          : item
      })

    case OutcomeActions.DELETE_SELF:
      return state
        .filter((item) => item.id !== action.payload.id)
        .map((item) => ({
          ...item,
          child_outcome_links: item.child_outcome_links.filter(
            (linkId) => linkId !== action.payload.parent_id
          )
        }))

    case OutcomeActions.UPDATE_HORIZONTAL_LINK:
      return updateStateForId(state, action, (item) => {
        const newData = action.payload.data.find((d) => d.id === item.id) || {}
        return { ...item, ...newData }
      })

    case OutcomeActions.DELETE_SELF_SOFT:
      return updateStateForId(state, action, (item) => {
        if (item.child_outcome_links.includes(action.payload.parent_id)) {
          const newChildLinks = item.child_outcome_links.filter(
            (linkId) => linkId !== action.payload.parent_id
          )
          return { ...item, child_outcome_links: newChildLinks }
        }
        return item.id === action.payload.id
          ? {
              ...item,
              deleted: true,
              deleted_on: window.gettext('This session')
            }
          : item
      })

    /*******************************************************
     * OUTCOME OUTCOME
     *******************************************************/
    case OutcomeOutcomeActions.CHANGE_ID:
      return state.map((item) => {
        const oldIndex = item.child_outcome_links.indexOf(action.payload.old_id)
        if (oldIndex >= 0) {
          const newLinks = [...item.child_outcome_links]
          newLinks.splice(oldIndex, 1, action.payload.new_id)
          return { ...item, child_outcome_links: newLinks }
        }
        return item
      })

    case OutcomeOutcomeActions.MOVED_TO:
      const { oldParent, oldParentIndex, newParent, newParentIndex } =
        findParentIndices(state, action)
      if (!oldParent || !newParent) return state

      const newOldParentLinks = oldParent.child_outcome_links.filter(
        (id) => id !== action.payload.id
      )
      const newParentLinks = [...newParent.child_outcome_links]
      newParentLinks.splice(action.payload.new_index, 0, action.payload.id)

      const newState = [...state]
      newState[oldParentIndex] = {
        ...oldParent,
        child_outcome_links: newOldParentLinks
      }
      if (oldParentIndex !== newParentIndex) {
        newState[newParentIndex] = {
          ...newParent,
          child_outcome_links: newParentLinks
        }
      }

      return newState

    /*******************************************************
     * OUTCOME BASE
     *******************************************************/
    case OutcomeBaseActions.DELETE_SELF:
      return state.filter((item) => item.id !== action.payload.id)

    case OutcomeBaseActions.DELETE_SELF_SOFT:
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              deleted: true,
              deleted_on: window.gettext('This session')
            }
          : item
      )

    case OutcomeBaseActions.RESTORE_SELF:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, deleted: false } : item
      )

    /*******************************************************
     * MIXED OUTCOME / OUTCOME BASE
     *******************************************************/

    case OutcomeActions.RELOAD_COMMENTS:
    case OutcomeBaseActions.RELOAD_COMMENTS:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, comments: action.payload.comment_data }
          : item
      )

    case OutcomeActions.NEW_OUTCOME:
    case OutcomeBaseActions.INSERT_BELOW:
      return [
        ...state,
        action.payload.new_model,
        ...(action.payload.children ? action.payload.children.outcome : [])
      ]

    case OutcomeActions.INSERT_CHILD:
    case OutcomeActions.INSERT_BELOW:
    case OutcomeBaseActions.INSERT_CHILD: {
      const parentIndex = state.findIndex(
        (item) => item.id === action.payload.parentID
      )
      if (parentIndex === -1) return state

      const newState = state.slice()
      const parentItem = { ...newState[parentIndex] }
      const newChildOutcomeLinks = [...parentItem.child_outcome_links]

      newChildOutcomeLinks.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      parentItem.child_outcome_links = newChildOutcomeLinks
      newState[parentIndex] = parentItem

      const childrenToAdd = action.payload.children
        ? action.payload.children.outcome
        : []
      return [...newState, action.payload.new_model, ...childrenToAdd]
    }

    case OutcomeActions.CHANGE_FIELD:
    case OutcomeBaseActions.CHANGE_FIELD:
      if (
        action.payload.changeFieldID ===
        COURSEFLOW_APP.contextData.changeFieldID
      )
        return state
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.json }
          : item
      )

    case OutcomeActions.CHANGE_FIELD_MANY:
    case OutcomeBaseActions.CHANGE_FIELD_MANY:
      if (
        action.payload.changeFieldID ===
        COURSEFLOW_APP.contextData.changeFieldID
      )
        return state
      return state.map((item) =>
        action.payload.ids.includes(item.id)
          ? { ...item, ...action.payload.json }
          : item
      )

    /*******************************************************
     * OUTCOME HORIZONTAL LINK
     *******************************************************/
    case OutcomeHorizontalLinkActions.UPDATE_DEGREE:
      // Returns -1 if the outcome had already been added to the node
      if (action.payload.outcomehorizontallink === -1) return state

      return state.map((item) => {
        if (item.id === action.payload.data_package[0].outcome) {
          return {
            ...item,
            outcome_horizontal_links:
              action.payload.new_outcome_horizontal_links,
            outcome_horizontal_links_unique:
              action.payload.new_outcome_horizontal_links_unique
          }
        }
        return item
      })

    default:
      return state
  }
}
