import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeHorizontalLinkActions,
  OutcomeOutcomeActions
} from '@cfRedux/types/enumActions'
import { TOutcome } from '@cfRedux/types/type'
import { UnknownAction } from '@reduxjs/toolkit'

// Common Actions
interface ReplaceStoreDataAction extends UnknownAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { outcome?: TOutcome[] }
}

interface RefreshStoreDataAction extends UnknownAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { outcome: TOutcome[] }
}

// Outcome Actions
interface CreateLockAction extends UnknownAction {
  type: OutcomeActions.CREATE_LOCK
  payload: { uuid: string; lock: CfLock }
}

interface RestoreSelfAction extends UnknownAction {
  type: OutcomeActions.RESTORE_SELF
  payload: {
    uuid: string
    parentuuid: string
    throughparentIndex: number
    throughparentuuid: string
  }
}

interface DeleteSelfAction extends UnknownAction {
  type: OutcomeActions.DELETE_SELF
  payload: { uuid: string; parentuuid: string }
}

interface UpdateHorizontalLinkAction extends UnknownAction {
  type: OutcomeActions.UPDATE_HORIZONTAL_LINK
  payload: { uuid: string; data: any[] } // Specify the data structure if possible
}

interface DeleteSelfSoftAction extends UnknownAction {
  type: OutcomeActions.DELETE_SELF_SOFT
  payload: { uuid: string; parentuuid: string }
}

interface NewOutcomeAction extends UnknownAction {
  type: OutcomeActions.NEW_OUTCOME
  payload: { newModel: TOutcome; children?: { outcome: TOutcome[] } }
}

interface InsertChildAction extends UnknownAction {
  type: OutcomeActions.INSERT_CHILD
  payload: {
    parentuuid: string
    newThrough: {
      uuid: string
      rank: number
    }
    children?: { outcome: TOutcome[] }
  }
}

interface InsertBelowAction extends UnknownAction {
  type: OutcomeActions.INSERT_BELOW
  payload: {
    parentuuid: string
    newThrough: {
      uuid: string
      rank: number
    }
    children?: { outcome: TOutcome[] }
  }
}

interface ReloadCommentsAction extends UnknownAction {
  type: OutcomeActions.RELOAD_COMMENTS
  payload: { uuid: string; commentData: any[] } // Specify the structure of `commentData`
}

interface ChangeFieldAction extends UnknownAction {
  type: OutcomeActions.CHANGE_FIELD
  payload: { uuid: string; json: any }
}

interface ChangeFieldManyAction extends UnknownAction {
  type: OutcomeActions.CHANGE_FIELD_MANY
  payload: { ids: number[]; json: any }
}

// Outcome Base Actions
interface DeleteSelfBaseAction extends UnknownAction {
  type: OutcomeBaseActions.DELETE_SELF
  payload: { uuid: string }
}

interface DeleteSelfSoftBaseAction extends UnknownAction {
  type: OutcomeBaseActions.DELETE_SELF_SOFT
  payload: { uuid: string }
}

interface RestoreSelfBaseAction extends UnknownAction {
  type: OutcomeBaseActions.RESTORE_SELF
  payload: { uuid: string }
}

interface ReloadCommentsBaseAction extends UnknownAction {
  type: OutcomeBaseActions.RELOAD_COMMENTS
  payload: { uuid: string; commentData: any[] }
}

interface InsertBelowBaseAction extends UnknownAction {
  type: OutcomeBaseActions.INSERT_BELOW
  payload: { newModel: TOutcome; children?: { outcome: TOutcome[] } }
}

// Union type for all actions handled by the reducer
type OutcomeActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | CreateLockAction
  | RestoreSelfAction
  | DeleteSelfAction
  | UpdateHorizontalLinkAction
  | DeleteSelfSoftAction
  | NewOutcomeAction
  | InsertChildAction
  | InsertBelowAction
  | ReloadCommentsAction
  | ChangeFieldAction
  | ChangeFieldManyAction
  | DeleteSelfBaseAction
  | DeleteSelfSoftBaseAction
  | RestoreSelfBaseAction
  | ReloadCommentsBaseAction
  | InsertBelowBaseAction

/*******************************************************
 * HELPERS
 *******************************************************/
const findAndReplaceOrAdd = (array, newItem) => {
  const index = array.findIndex((item) => item.uuid === newItem.uuid)
  if (index !== -1) {
    return [...array.slice(0, index), newItem, ...array.slice(index + 1)]
  }
  return [...array, newItem]
}

const updateStateForId = (state, action, updateCallback) => {
  return state.map((item) =>
    item.uuid === action.payload.uuid ? updateCallback(item) : item
  )
}

const findParentIndices = (state, action) => {
  let oldParentIndex, newParentIndex
  const oldParent = state.find((item, index) => {
    if (item.childOutcomeLinks.includes(action.payload.uuid)) {
      oldParentIndex = index
      return true
    }
    return false
  })

  const newParent = state.find((item, index) => {
    if (item.uuid === action.payload.newParent) {
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
  state: TOutcome[] = [],
  action: OutcomeActionTypes
): TOutcome[] {
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
        if (item.uuid === action.payload.parentId) {
          const newChildLinks = [...item.childOutcomeLinks]
          newChildLinks.splice(
            action.payload.throughparentIndex,
            0,
            action.payload.throughparentId
          )
          return { ...item, childOutcomeLinks: newChildLinks }
        }
        return item.uuid === action.payload.uuid
          ? { ...item, deleted: false }
          : item
      })

    case OutcomeActions.DELETE_SELF:
      return state
        .filter((item) => item.uuid !== action.payload.uuid)
        .map((item) => ({
          ...item,
          childOutcomeLinks: item.childOutcomeLinks.filter(
            (linkId) => linkId !== action.payload.parentId
          )
        }))

    case OutcomeActions.UPDATE_HORIZONTAL_LINK:
      return updateStateForId(state, action, (item) => {
        const newData =
          action.payload.data.find((d) => d.uuid === item.uuid) || {}
        return { ...item, ...newData }
      })

    case OutcomeActions.DELETE_SELF_SOFT:
      return updateStateForId(state, action, (item) => {
        if (item.childOutcomeLinks.includes(action.payload.parentId)) {
          const newChildLinks = item.childOutcomeLinks.filter(
            (linkId) => linkId !== action.payload.parentId
          )
          return { ...item, childOutcomeLinks: newChildLinks }
        }
        return item.uuid === action.payload.uuid
          ? {
              ...item,
              deleted: true,
              deletedOn: _t('This session')
            }
          : item
      })

    /*******************************************************
     * OUTCOME OUTCOME
     *******************************************************/
    case OutcomeOutcomeActions.CHANGE_ID:
      return state.map((item) => {
        const oldIndex = item.childOutcomeLinks.indexOf(action.payload.oldId)
        if (oldIndex >= 0) {
          const newLinks = [...item.childOutcomeLinks]
          newLinks.splice(oldIndex, 1, action.payload.newId)
          return { ...item, childOutcomeLinks: newLinks }
        }
        return item
      })

    case OutcomeOutcomeActions.MOVED_TO: {
      const { oldParent, oldParentIndex, newParent, newParentIndex } =
        findParentIndices(state, action)
      if (!oldParent || !newParent) {
        return state
      }

      const newOldParentLinks = oldParent.childOutcomeLinks.filter(
        (id) => id !== action.payload.uuid
      )
      const newParentLinks = [...newParent.childOutcomeLinks]
      newParentLinks.splice(action.payload.newIndex, 0, action.payload.uuid)

      const newState = [...state]
      newState[oldParentIndex] = {
        ...oldParent,
        childOutcomeLinks: newOldParentLinks
      }
      if (oldParentIndex !== newParentIndex) {
        newState[newParentIndex] = {
          ...newParent,
          childOutcomeLinks: newParentLinks
        }
      }
      return newState
    }

    /*******************************************************
     * OUTCOME BASE
     *******************************************************/
    case OutcomeBaseActions.DELETE_SELF:
      return state.filter((item) => item.uuid !== action.payload.uuid)

    case OutcomeBaseActions.DELETE_SELF_SOFT:
      return state.map((item) =>
        item.uuid === action.payload.uuid
          ? {
              ...item,
              deleted: true,
              deletedOn: _t('This session')
            }
          : item
      )

    case OutcomeBaseActions.RESTORE_SELF:
      return state.map((item) =>
        item.uuid === action.payload.uuid ? { ...item, deleted: false } : item
      )

    /*******************************************************
     * MIXED OUTCOME / OUTCOME BASE
     *******************************************************/

    case OutcomeActions.RELOAD_COMMENTS:
    case OutcomeBaseActions.RELOAD_COMMENTS:
      return state.map((item) =>
        item.uuid === action.payload.uuid
          ? { ...item, comments: action.payload.commentData }
          : item
      )

    case OutcomeActions.NEW_OUTCOME:
    case OutcomeBaseActions.INSERT_BELOW:
      return [
        ...state,
        action.payload.newModel,
        ...(action.payload.children ? action.payload.children.outcome : [])
      ]

    case OutcomeActions.INSERT_CHILD:
    case OutcomeActions.INSERT_BELOW:
    case OutcomeBaseActions.INSERT_CHILD: {
      const parentIndex = state.findIndex(
        (item) => item.uuid === action.payload.parentId
      )
      if (parentIndex === -1) {
        return state
      }

      const newState = state.slice()
      const parentItem = { ...newState[parentIndex] }
      const newChildOutcomeLinks = [...parentItem.childOutcomeLinks]

      newChildOutcomeLinks.splice(
        action.payload.newThrough.rank,
        0,
        action.payload.newThrough.uuid
      )
      parentItem.childOutcomeLinks = newChildOutcomeLinks
      newState[parentIndex] = parentItem

      const childrenToAdd = action.payload.children
        ? action.payload.children.outcome
        : []
      return [...newState, action.payload.newModel, ...childrenToAdd]
    }

    case OutcomeActions.CHANGE_FIELD:
    case OutcomeBaseActions.CHANGE_FIELD:
      return state.map((item) =>
        item.uuid === action.payload.uuid
          ? { ...item, ...action.payload.json }
          : item
      )

    case OutcomeActions.CHANGE_FIELD_MANY:
    case OutcomeBaseActions.CHANGE_FIELD_MANY:
      return state.map((item) =>
        action.payload.uuids.includes(item.uuid)
          ? { ...item, ...action.payload.json }
          : item
      )

    /*******************************************************
     * OUTCOME HORIZONTAL LINK
     *******************************************************/
    case OutcomeHorizontalLinkActions.UPDATE_DEGREE:
      // Returns -1 if the outcome had already been added to the node
      if (action.payload.outcomehorizontallink === -1) {
        return state
      }

      return state.map((item) => {
        if (item.uuid === action.payload.dataPackage[0].outcome) {
          return {
            ...item,
            outcomeHorizontalLinks: action.payload.newOutcomeHorizontalLinks,
            outcomeHorizontalLinksUnique:
              action.payload.newOutcomeHorizontalLinksUnique
          }
        }
        return item
      })

    default:
      return state
  }
}
