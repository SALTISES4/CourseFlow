import {
  ColumnActions,
  ColumnWorkflowActions,
  CommonActions,
  NodeActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeWorkflowActions,
  StrategyActions,
  WeekActions,
  WeekWorkflowActions,
  WorkflowActions
} from '@cfRedux/types/enumActions'
import { TWorkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'
interface ReplaceStoreDataAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { workflow?: TWorkflow }
}

interface RefreshStoreDataAction extends AnyAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { workflow: TWorkflow }
}

interface ClearWorkflowDataAction extends AnyAction {
  type: CommonActions.CLEAR_WORKFLOW_DATA
}

interface WorkflowGenericAction extends AnyAction {
  type:
    | WorkflowActions
    | OutcomeWorkflowActions
    | ColumnWorkflowActions
    | WeekWorkflowActions
    | WeekActions
    | StrategyActions
    | OutcomeActions
    | OutcomeBaseActions
    | NodeActions
    | ColumnActions
  payload: {
    [key: string]: any // This handles various payloads generically
  }
}

// Union type for all actions handled by the reducer
type WorkflowActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | ClearWorkflowDataAction
  | WorkflowGenericAction

function workflowReducer(
  state: TWorkflow = {} as TWorkflow,
  action: WorkflowActionTypes
): TWorkflow {
  switch (action.type) {
    /*******************************************************
     * COMMON
     *******************************************************/
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.workflow) {
        return action.payload.workflow
      }
      return state

    case CommonActions.REFRESH_STOREDATA:
      if (action.payload.workflow) {
        return action.payload.workflow
      }
      return state

    // pretty obvious what this is doing
    // BUT really it should be cleaning up all the workflow related objects
    // columnworfklow
    // node
    // week etc
    case CommonActions.CLEAR_WORKFLOW_DATA:
      return null

    /*******************************************************
     * WORKFLOW
     *******************************************************/
    case WorkflowActions.DELETE_SELF_SOFT:
      return {
        ...state,
        deleted: true
      }

    case WorkflowActions.RESTORE_SELF:
      return {
        ...state,
        deleted: false
      }

    case WorkflowActions.CREATELOCK: {
      if (state.id === action.payload.id) {
        return {
          ...state,
          lock: action.payload.lock
        }
      }
      return state
    }

    case WorkflowActions.CHANGE_FIELD: {
      return {
        ...state,
        ...action.payload.json
      }
    }

    /*******************************************************
     * OUTCOME WORKFLOW
     *******************************************************/
    case OutcomeWorkflowActions.CHANGE_ID: {
      const newState = { ...state }
      const oldIndex = state.outcomeworkflowSet.indexOf(action.payload.oldId)
      if (oldIndex >= 0) {
        newState.outcomeworkflowSet = newState.outcomeworkflowSet.slice()
        newState.outcomeworkflowSet.splice(oldIndex, 1, action.payload.newId)
      }
      return newState
    }

    case OutcomeWorkflowActions.MOVED_TO: {
      const newOutcomeworkflowSet = state.outcomeworkflowSet.slice()
      for (let i = 0; i < newOutcomeworkflowSet.length; i++) {
        if (newOutcomeworkflowSet[i] == action.payload.id) {
          newOutcomeworkflowSet.splice(
            action.payload.newIndex,
            0,
            newOutcomeworkflowSet.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        outcomeworkflowSet: newOutcomeworkflowSet
      }
    }

    /*******************************************************
     * COLUMN WORKFLOW
     *******************************************************/
    case ColumnWorkflowActions.CHANGE_ID: {
      const newState = { ...state }
      const oldIndex = state.columnworkflowSet.indexOf(action.payload.oldId)
      if (oldIndex >= 0) {
        newState.columnworkflowSet = newState.columnworkflowSet.slice()
        newState.columnworkflowSet.splice(oldIndex, 1, action.payload.newId)
      }
      return newState
    }

    case ColumnWorkflowActions.MOVED_TO: {
      const newColumnworkflowSet = state.columnworkflowSet.slice()
      for (let i = 0; i < newColumnworkflowSet.length; i++) {
        if (newColumnworkflowSet[i] == action.payload.id) {
          newColumnworkflowSet.splice(
            action.payload.newIndex,
            0,
            newColumnworkflowSet.splice(i, 1)[0]
          )
          break
        }
      }
      // this is here becasue this data is rare
      console.log('state.columnworkflowSet')
      console.log(state.columnworkflowSet)
      console.log(newColumnworkflowSet)
      return {
        ...state,
        columnworkflowSet: newColumnworkflowSet
      }
    }

    /*******************************************************
     * WEEK WORKFLOW
     *******************************************************/
    case WeekWorkflowActions.MOVED_TO: {
      const newWeekworkflowSet = state.weekworkflowSet.slice()
      for (let i = 0; i < newWeekworkflowSet.length; i++) {
        if (newWeekworkflowSet[i] == action.payload.id) {
          newWeekworkflowSet.splice(
            action.payload.newIndex,
            0,
            newWeekworkflowSet.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        weekworkflowSet: newWeekworkflowSet
      }
    }

    case WeekWorkflowActions.CHANGE_ID: {
      const oldIndex = state.weekworkflowSet.indexOf(action.payload.oldId)
      if (oldIndex >= 0) {
        const updatedWeekworkflowSet = state.weekworkflowSet.slice()
        updatedWeekworkflowSet.splice(oldIndex, 1, action.payload.newId)
        return {
          ...state,
          weekworkflowSet: updatedWeekworkflowSet
        }
      }
      return state
    }

    /*******************************************************
     * WEEK
     *******************************************************/
    case WeekActions.DELETE_SELF:
    case WeekActions.DELETE_SELF_SOFT: {
      if (state.weekworkflowSet.indexOf(action.payload.parentId) >= 0) {
        const newState = { ...state }
        newState.weekworkflowSet = state.weekworkflowSet.slice()
        newState.weekworkflowSet.splice(
          newState.weekworkflowSet.indexOf(action.payload.parentId),
          1
        )
        return newState
      }
      return state
    }

    case WeekActions.RESTORE_SELF: {
      const newState = { ...state }
      newState.weekworkflowSet = state.weekworkflowSet.slice()
      newState.weekworkflowSet.splice(
        action.payload.throughparentIndex,
        0,
        action.payload.throughparentId
      )
      return newState
    }

    case WeekActions.INSERT_BELOW: {
      const newState = { ...state }
      const newWeekworkflowSet = state.weekworkflowSet.slice()
      newWeekworkflowSet.splice(
        action.payload.newThrough.rank,
        0,
        action.payload.newThrough.id
      )
      newState.weekworkflowSet = newWeekworkflowSet
      return newState
    }

    /*******************************************************
     * OUTCOME BASE
     *******************************************************/
    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT:
      const parentId = action.payload.parentId
      if (state.outcomeworkflowSet.includes(parentId)) {
        return {
          ...state,
          outcomeworkflowSet: state.outcomeworkflowSet.filter(
            (id) => id !== parentId
          )
        }
      }
      return state

    case OutcomeBaseActions.RESTORE_SELF: {
      const newState = { ...state }
      newState.outcomeworkflowSet = state.outcomeworkflowSet.slice()
      newState.outcomeworkflowSet.splice(
        action.payload.throughparentIndex,
        0,
        action.payload.throughparentId
      )
      return newState
    }

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME: {
      if (state.id != action.payload.newThrough.workflow) {
        return state
      }
      const newState = { ...state }
      const newOutcomeworkflowSet = state.outcomeworkflowSet.slice()
      newOutcomeworkflowSet.splice(
        action.payload.newThrough.rank,
        0,
        action.payload.newThrough.id
      )
      newState.outcomeworkflowSet = newOutcomeworkflowSet
      return newState
    }

    /*******************************************************
     * STRATEGY
     *******************************************************/
    case StrategyActions.ADD_STRATEGY: {
      const newState = { ...state }
      const newWeekworkflowSet = state.weekworkflowSet.slice()
      newWeekworkflowSet.splice(
        action.payload.index,
        0,
        action.payload.newThrough.id
      )
      newState.weekworkflowSet = newWeekworkflowSet
      if (action.payload.columnworkflowsAdded.length > 0) {
        const newColumnworkflowSet = state.columnworkflowSet.slice()
        newColumnworkflowSet.push(
          ...action.payload.columnworkflowsAdded.map(
            (columnworkflow) => columnworkflow.id
          )
        )
        newState.columnworkflowSet = newColumnworkflowSet
      }
      return newState
    }

    /*******************************************************
     * NODE
     *******************************************************/
    case NodeActions.NEW_NODE: {
      const newState = { ...state }
      if (
        state.columnworkflowSet.indexOf(action.payload.columnworkflow.id) >= 0
      ) {
        return state
      }
      const newColumnworkflowSet = state.columnworkflowSet.slice()
      newColumnworkflowSet.push(action.payload.columnworkflow.id)
      newState.columnworkflowSet = newColumnworkflowSet
      return newState
    }

    /*******************************************************
     * COLUMN
     *******************************************************/
    case ColumnActions.RESTORE_SELF: {
      const newState = { ...state }
      newState.columnworkflowSet = state.columnworkflowSet.slice()
      newState.columnworkflowSet.splice(
        action.payload.throughparentIndex,
        0,
        action.payload.throughparentId
      )
      return newState
    }
    case ColumnActions.DELETE_SELF:
    case ColumnActions.DELETE_SELF_SOFT: {
      if (state.columnworkflowSet.indexOf(action.payload.parentId) >= 0) {
        const newState = { ...state }
        newState.columnworkflowSet = state.columnworkflowSet.slice()
        newState.columnworkflowSet.splice(
          newState.columnworkflowSet.indexOf(action.payload.parentId),
          1
        )
        return newState
      }
      return state
    }

    case ColumnActions.INSERT_BELOW: {
      const newState = { ...state }
      const newColumnworkflowSet = state.columnworkflowSet.slice()
      newColumnworkflowSet.splice(
        action.payload.newThrough.rank,
        0,
        action.payload.newThrough.id
      )
      newState.columnworkflowSet = newColumnworkflowSet
      return newState
    }

    default:
      return state
  }
}

export default workflowReducer
