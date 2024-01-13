import { AnyAction } from '@reduxjs/toolkit'
import { Workflow } from '@cfRedux/type'
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
} from '@cfRedux/enumActions'

function workflowReducer(
  state: Workflow = {} as Workflow,
  action: AnyAction
): Workflow {
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

    case WorkFlowActions.CHANGE_FIELD: {
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
      const new_state = { ...state }
      const old_index = state.outcomeworkflow_set.indexOf(action.payload.old_id)
      if (old_index >= 0) {
        new_state.outcomeworkflow_set = new_state.outcomeworkflow_set.slice()
        new_state.outcomeworkflow_set.splice(
          old_index,
          1,
          action.payload.new_id
        )
      }
      return new_state
    }

    case OutcomeWorkflowActions.MOVED_TO: {
      const new_outcomeworkflow_set = state.outcomeworkflow_set.slice()
      for (let i = 0; i < new_outcomeworkflow_set.length; i++) {
        if (new_outcomeworkflow_set[i] == action.payload.id) {
          new_outcomeworkflow_set.splice(
            action.payload.new_index,
            0,
            new_outcomeworkflow_set.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        outcomeworkflow_set: new_outcomeworkflow_set
      }
    }

    /*******************************************************
     * COLUMN WORKFLOW
     *******************************************************/
    case ColumnWorkflowActions.CHANGE_ID: {
      const new_state = { ...state }
      const old_index = state.columnworkflow_set.indexOf(action.payload.old_id)
      if (old_index >= 0) {
        new_state.columnworkflow_set = new_state.columnworkflow_set.slice()
        new_state.columnworkflow_set.splice(old_index, 1, action.payload.new_id)
      }
      return new_state
    }

    case ColumnWorkflowActions.MOVED_TO: {
      const new_columnworkflow_set = state.columnworkflow_set.slice()
      for (let i = 0; i < new_columnworkflow_set.length; i++) {
        if (new_columnworkflow_set[i] == action.payload.id) {
          new_columnworkflow_set.splice(
            action.payload.new_index,
            0,
            new_columnworkflow_set.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        columnworkflow_set: new_columnworkflow_set
      }
    }

    /*******************************************************
     * WEEK WORKFLOW
     *******************************************************/
    case WeekWorkflowActions.MOVED_TO: {
      const new_weekworkflow_set = state.weekworkflow_set.slice()
      for (let i = 0; i < new_weekworkflow_set.length; i++) {
        if (new_weekworkflow_set[i] == action.payload.id) {
          new_weekworkflow_set.splice(
            action.payload.new_index,
            0,
            new_weekworkflow_set.splice(i, 1)[0]
          )
          break
        }
      }
      return {
        ...state,
        weekworkflow_set: new_weekworkflow_set
      }
    }

    case WeekWorkflowActions.CHANGE_ID: {
      const old_index = state.weekworkflow_set.indexOf(action.payload.old_id)
      if (old_index >= 0) {
        const updatedWeekworkflowSet = state.weekworkflow_set.slice()
        updatedWeekworkflowSet.splice(old_index, 1, action.payload.new_id)
        return {
          ...state,
          weekworkflow_set: updatedWeekworkflowSet
        }
      }
      return state
    }

    /*******************************************************
     * WEEK
     *******************************************************/
    case WeekActions.DELETE_SELF:
    case WeekActions.DELETE_SELF_SOFT: {
      if (state.weekworkflow_set.indexOf(action.payload.parent_id) >= 0) {
        const new_state = { ...state }
        new_state.weekworkflow_set = state.weekworkflow_set.slice()
        new_state.weekworkflow_set.splice(
          new_state.weekworkflow_set.indexOf(action.payload.parent_id),
          1
        )
        return new_state
      }
      return state
    }

    case WeekActions.RESTORE_SELF: {
      const new_state = { ...state }
      new_state.weekworkflow_set = state.weekworkflow_set.slice()
      new_state.weekworkflow_set.splice(
        action.payload.throughparent_index,
        0,
        action.payload.throughparent_id
      )
      return new_state
    }

    case WeekActions.INSERT_BELOW: {
      const new_state = { ...state }
      const new_weekworkflow_set = state.weekworkflow_set.slice()
      new_weekworkflow_set.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      new_state.weekworkflow_set = new_weekworkflow_set
      return new_state
    }

    /*******************************************************
     * OUTCOME BASE
     *******************************************************/
    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT:
      const parent_id = action.payload.parent_id
      if (state.outcomeworkflow_set.includes(parent_id)) {
        return {
          ...state,
          outcomeworkflow_set: state.outcomeworkflow_set.filter(
            (id) => id !== parent_id
          )
        }
      }
      return state

    case OutcomeBaseActions.RESTORE_SELF: {
      const new_state = { ...state }
      new_state.outcomeworkflow_set = state.outcomeworkflow_set.slice()
      new_state.outcomeworkflow_set.splice(
        action.payload.throughparent_index,
        0,
        action.payload.throughparent_id
      )
      return new_state
    }

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME: {
      if (state.id != action.payload.new_through.workflow) return state
      const new_state = { ...state }
      const new_outcomeworkflow_set = state.outcomeworkflow_set.slice()
      new_outcomeworkflow_set.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      new_state.outcomeworkflow_set = new_outcomeworkflow_set
      return new_state
    }

    /*******************************************************
     * STRATEGY
     *******************************************************/
    case StrategyActions.ADD_STRATEGY: {
      const new_state = { ...state }
      const new_weekworkflow_set = state.weekworkflow_set.slice()
      new_weekworkflow_set.splice(
        action.payload.index,
        0,
        action.payload.new_through.id
      )
      new_state.weekworkflow_set = new_weekworkflow_set
      if (action.payload.columnworkflows_added.length > 0) {
        const new_columnworkflow_set = state.columnworkflow_set.slice()
        new_columnworkflow_set.push(
          ...action.payload.columnworkflows_added.map(
            (columnworkflow) => columnworkflow.id
          )
        )
        new_state.columnworkflow_set = new_columnworkflow_set
      }
      return new_state
    }

    /*******************************************************
     * NODE
     *******************************************************/
    case NodeActions.NEW_NODE: {
      const new_state = { ...state }
      if (
        state.columnworkflow_set.indexOf(action.payload.columnworkflow.id) >= 0
      ) {
        return state
      }
      const new_columnworkflow_set = state.columnworkflow_set.slice()
      new_columnworkflow_set.push(action.payload.columnworkflow.id)
      new_state.columnworkflow_set = new_columnworkflow_set
      return new_state
    }

    /*******************************************************
     * COLUMN
     *******************************************************/
    case ColumnActions.RESTORE_SELF: {
      const new_state = { ...state }
      new_state.columnworkflow_set = state.columnworkflow_set.slice()
      new_state.columnworkflow_set.splice(
        action.payload.throughparent_index,
        0,
        action.payload.throughparent_id
      )
      return new_state
    }
    case ColumnActions.DELETE_SELF:
    case ColumnActions.DELETE_SELF_SOFT: {
      if (state.columnworkflow_set.indexOf(action.payload.parent_id) >= 0) {
        const new_state = { ...state }
        new_state.columnworkflow_set = state.columnworkflow_set.slice()
        new_state.columnworkflow_set.splice(
          new_state.columnworkflow_set.indexOf(action.payload.parent_id),
          1
        )
        return new_state
      }
      return state
    }

    case ColumnActions.INSERT_BELOW: {
      const new_state = { ...state }
      const new_columnworkflow_set = state.columnworkflow_set.slice()
      new_columnworkflow_set.splice(
        action.payload.new_through.rank,
        0,
        action.payload.new_through.id
      )
      new_state.columnworkflow_set = new_columnworkflow_set
      return new_state
    }

    default:
      return state
  }
}

export default workflowReducer
