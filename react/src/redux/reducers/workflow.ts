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
  WorkFlowActions
} from '@cfRedux/types/enumActions'
import { TWorkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

function workflowReducer(
  state: TWorkflow = {} as TWorkflow,
  action: AnyAction
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
    case WorkFlowActions.DELETE_SELF_SOFT:
      return {
        ...state,
        deleted: true
      }

    case WorkFlowActions.RESTORE_SELF:
      return {
        ...state,
        deleted: false
      }

    case WorkFlowActions.CREATELOCK: {
      if (state.id === action.payload.id) {
        return {
          ...state,
          lock: action.payload.lock
        }
      }
      return state
    }

    case WorkFlowActions.changeField: {
      if (
        action.payload.changeFieldID ===
        // @ts-ignore
        COURSEFLOW_APP.contextData.changeFieldID
      ) {
        return state
      }
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
      const old_index = state.outcomeworkflowSet.indexOf(action.payload.old_id)
      if (old_index >= 0) {
        newState.outcomeworkflowSet = newState.outcomeworkflowSet.slice()
        newState.outcomeworkflowSet.splice(old_index, 1, action.payload.new_id)
      }
      return newState
    }

    case OutcomeWorkflowActions.MOVED_TO: {
      const new_outcomeworkflowSet = state.outcomeworkflowSet.slice()
      for (let i = 0; i < new_outcomeworkflowSet.length; i++) {
        if (new_outcomeworkflowSet[i] == action.payload.id) {
          new_outcomeworkflowSet.splice(
            action.payload.new_index,
            0,
            new_outcomeworkflowSet.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        outcomeworkflowSet: new_outcomeworkflowSet
      }
    }

    /*******************************************************
     * COLUMN WORKFLOW
     *******************************************************/
    case ColumnWorkflowActions.CHANGE_ID: {
      const newState = { ...state }
      const old_index = state.columnworkflowSet.indexOf(action.payload.old_id)
      if (old_index >= 0) {
        newState.columnworkflowSet = newState.columnworkflowSet.slice()
        newState.columnworkflowSet.splice(old_index, 1, action.payload.new_id)
      }
      return newState
    }

    case ColumnWorkflowActions.MOVED_TO: {
      const new_columnworkflowSet = state.columnworkflowSet.slice()
      for (let i = 0; i < new_columnworkflowSet.length; i++) {
        if (new_columnworkflowSet[i] == action.payload.id) {
          new_columnworkflowSet.splice(
            action.payload.new_index,
            0,
            new_columnworkflowSet.splice(i, 1)[0]
          )
          break
        }
      }
      // this is here becasue this data is rare
      console.log('state.columnworkflowSet')
      console.log(state.columnworkflowSet)
      console.log(new_columnworkflowSet)
      return {
        ...state,
        columnworkflowSet: new_columnworkflowSet
      }
    }

    /*******************************************************
     * WEEK WORKFLOW
     *******************************************************/
    case WeekWorkflowActions.MOVED_TO: {
      const new_weekworkflowSet = state.weekworkflowSet.slice()
      for (let i = 0; i < new_weekworkflowSet.length; i++) {
        if (new_weekworkflowSet[i] == action.payload.id) {
          new_weekworkflowSet.splice(
            action.payload.new_index,
            0,
            new_weekworkflowSet.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        weekworkflowSet: new_weekworkflowSet
      }
    }

    case WeekWorkflowActions.CHANGE_ID: {
      const old_index = state.weekworkflowSet.indexOf(action.payload.old_id)
      if (old_index >= 0) {
        const updatedWeekworkflowSet = state.weekworkflowSet.slice()
        updatedWeekworkflowSet.splice(old_index, 1, action.payload.new_id)
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
      if (state.weekworkflowSet.indexOf(action.payload.parent_id) >= 0) {
        const newState = { ...state }
        newState.weekworkflowSet = state.weekworkflowSet.slice()
        newState.weekworkflowSet.splice(
          newState.weekworkflowSet.indexOf(action.payload.parent_id),
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
        action.payload.throughparent_index,
        0,
        action.payload.throughparent_id
      )
      return newState
    }

    case WeekActions.INSERT_BELOW: {
      const newState = { ...state }
      const new_weekworkflowSet = state.weekworkflowSet.slice()
      new_weekworkflowSet.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      newState.weekworkflowSet = new_weekworkflowSet
      return newState
    }

    /*******************************************************
     * OUTCOME BASE
     *******************************************************/
    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT:
      const parent_id = action.payload.parent_id
      if (state.outcomeworkflowSet.includes(parent_id)) {
        return {
          ...state,
          outcomeworkflowSet: state.outcomeworkflowSet.filter(
            (id) => id !== parent_id
          )
        }
      }
      return state

    case OutcomeBaseActions.RESTORE_SELF: {
      const newState = { ...state }
      newState.outcomeworkflowSet = state.outcomeworkflowSet.slice()
      newState.outcomeworkflowSet.splice(
        action.payload.throughparent_index,
        0,
        action.payload.throughparent_id
      )
      return newState
    }

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME: {
      if (state.id != action.payload.new_through.workflow) return state
      const newState = { ...state }
      const new_outcomeworkflowSet = state.outcomeworkflowSet.slice()
      new_outcomeworkflowSet.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      newState.outcomeworkflowSet = new_outcomeworkflowSet
      return newState
    }

    /*******************************************************
     * STRATEGY
     *******************************************************/
    case StrategyActions.ADD_STRATEGY: {
      const newState = { ...state }
      const new_weekworkflowSet = state.weekworkflowSet.slice()
      new_weekworkflowSet.splice(
        action.payload.index,
        0,
        action.payload.new_through.id
      )
      newState.weekworkflowSet = new_weekworkflowSet
      if (action.payload.columnworkflows_added.length > 0) {
        const new_columnworkflowSet = state.columnworkflowSet.slice()
        new_columnworkflowSet.push(
          ...action.payload.columnworkflows_added.map(
            (columnworkflow) => columnworkflow.id
          )
        )
        newState.columnworkflowSet = new_columnworkflowSet
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
      const new_columnworkflowSet = state.columnworkflowSet.slice()
      new_columnworkflowSet.push(action.payload.columnworkflow.id)
      newState.columnworkflowSet = new_columnworkflowSet
      return newState
    }

    /*******************************************************
     * COLUMN
     *******************************************************/
    case ColumnActions.RESTORE_SELF: {
      const newState = { ...state }
      newState.columnworkflowSet = state.columnworkflowSet.slice()
      newState.columnworkflowSet.splice(
        action.payload.throughparent_index,
        0,
        action.payload.throughparent_id
      )
      return newState
    }
    case ColumnActions.DELETE_SELF:
    case ColumnActions.DELETE_SELF_SOFT: {
      if (state.columnworkflowSet.indexOf(action.payload.parent_id) >= 0) {
        const newState = { ...state }
        newState.columnworkflowSet = state.columnworkflowSet.slice()
        newState.columnworkflowSet.splice(
          newState.columnworkflowSet.indexOf(action.payload.parent_id),
          1
        )
        return newState
      }
      return state
    }

    case ColumnActions.INSERT_BELOW: {
      const newState = { ...state }
      const new_columnworkflowSet = state.columnworkflowSet.slice()
      new_columnworkflowSet.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      newState.columnworkflowSet = new_columnworkflowSet
      return newState
    }

    default:
      return state
  }
}

export default workflowReducer
