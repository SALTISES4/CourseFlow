import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeWorkflowActions,
  SliceNamespace,
  StrategyActions,
  WeekActions,
  WeekWorkflowActions
} from '@cfRedux/types/enumActions'
import { TWorkflow, WorkspaceAppState } from '@cfRedux/types/type'
import { PayloadAction, createAction, createSlice } from '@reduxjs/toolkit'

import { columnDeleteSelf, columnInsertBelow } from './column.slice'

const initialState: TWorkflow = {} as TWorkflow

/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
const replaceStoreData = createAction<{
  workflow: WorkspaceAppState['workflow'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

const refreshStoreData = createAction<{
  workflow: WorkspaceAppState['workflow'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICE
 *******************************************************/
const workflowSlice = createSlice({
  name: SliceNamespace.WORKFLOW,
  initialState,
  reducers: {
    deleteSelfSoft(state) {
      state.deleted = true
    },
    restoreSelf(state) {
      state.deleted = false
    },
    createLock(state, action: PayloadAction<{ id: number; lock: any }>) {
      if (state.id === action.payload.id) {
        state.lock = action.payload.lock
      }
    },
    changeField(state, action: PayloadAction<{ json: any }>) {
      Object.assign(state, action.payload.json)
    },

    // workflow reorder columns
    reorderColumns(
      state,
      action: PayloadAction<{ moveIndex: number; toIndex: number }>
    ) {
      const { moveIndex, toIndex } = action.payload

      if (moveIndex === toIndex) {
        return
      }

      const deleted = state.columns.splice(moveIndex, 1)
      state.columns.splice(toIndex, 0, ...deleted)
    },

    // sections / weeks
    reorderSection(
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) {
      const { fromIndex, toIndex } = action.payload

      if (fromIndex === toIndex) {
        return
      }

      const moved = state.weeks.splice(fromIndex, 1)
      state.weeks.splice(toIndex, 0, ...moved)
    }
  },
  extraReducers: (builder) => {
    // Common Actions
    builder
      .addCase(replaceStoreData, (state, action) => {
        return action.payload.workflow || state
      })
      .addCase(refreshStoreData, (state, action) => {
        return action.payload.workflow || state
      })
      .addCase(CommonActions.CLEAR_WORKFLOW_DATA, () => initialState)

    // Outcome Workflow Actions
    builder
      .addCase(
        OutcomeWorkflowActions.CHANGE_ID as string,
        (state, action: PayloadAction<{ oldId: number; newId: number }>) => {
          const index = state.outcomes.indexOf(action.payload.oldId)
          if (index >= 0) {
            state.outcomes.splice(index, 1, action.payload.newId)
          }
        }
      )
      .addCase(
        OutcomeWorkflowActions.MOVED_TO as string,
        (state, action: PayloadAction<{ id: number; newIndex: number }>) => {
          const index = state.outcomes.indexOf(action.payload.id)
          if (index >= 0) {
            state.outcomes.splice(index, 1)
            state.outcomes.splice(action.payload.newIndex, 0, action.payload.id)
          }
        }
      )

    // Week Workflow Actions
    builder
      .addCase(
        WeekWorkflowActions.MOVED_TO as string,
        (state, action: PayloadAction<{ id: number; newIndex: number }>) => {
          const index = state.weeks.indexOf(action.payload.id)
          if (index >= 0) {
            state.weeks.splice(index, 1)
            state.weeks.splice(action.payload.newIndex, 0, action.payload.id)
          }
        }
      )
      .addCase(
        WeekWorkflowActions.CHANGE_ID as string,
        (state, action: PayloadAction<{ oldId: number; newId: number }>) => {
          const index = state.weeks.indexOf(action.payload.oldId)
          if (index >= 0) {
            state.weeks.splice(index, 1, action.payload.newId)
          }
        }
      )

    // Week Actions
    builder
      .addCase(
        WeekActions.DELETE_SELF as string,
        (state, action: PayloadAction<{ id: number }>) => {
          state.weeks = state.weeks.filter((id) => id !== action.payload.id)
        }
      )
      .addCase(
        WeekActions.RESTORE_SELF as string,
        (
          state,
          action: PayloadAction<{
            throughparentIndex: number
            throughparentId: number
          }>
        ) => {
          state.weeks.splice(
            action.payload.throughparentIndex,
            0,
            action.payload.throughparentId
          )
        }
      )
      .addCase(
        WeekActions.INSERT_BELOW as string,
        (state, action: PayloadAction<{ id: number; newId: number }>) => {
          const { id, newId } = action.payload
          const insertAtIndex = state.weeks.indexOf(id)
          state.weeks.splice(insertAtIndex + 1, 0, newId)
        }
      )

    // Outcome Base Actions
    builder
      .addCase(
        OutcomeBaseActions.DELETE_SELF as string,
        (state, action: PayloadAction<{ parentId: number }>) => {
          state.outcomes = state.outcomes.filter(
            (id) => id !== action.payload.parentId
          )
        }
      )
      .addCase(
        OutcomeBaseActions.RESTORE_SELF as string,
        (
          state,
          action: PayloadAction<{
            throughparentIndex: number
            throughparentId: number
          }>
        ) => {
          state.outcomes.splice(
            action.payload.throughparentIndex,
            0,
            action.payload.throughparentId
          )
        }
      )
      .addCase(
        OutcomeActions.NEW_OUTCOME as string,
        (
          state,
          action: PayloadAction<{
            newThrough: { rank: number; id: number; workflow: number }
          }>
        ) => {
          if (state.id !== action.payload.newThrough.workflow) {
            return
          }
          state.outcomes.splice(
            action.payload.newThrough.rank,
            0,
            action.payload.newThrough.id
          )
        }
      )

    // Strategy Actions
    builder.addCase(
      StrategyActions.ADD_STRATEGY as string,
      (
        state,
        action: PayloadAction<{
          index: number
          newThrough: { id: number }
          columnworkflowsAdded: any[]
        }>
      ) => {
        state.weeks.splice(
          action.payload.index,
          0,
          action.payload.newThrough.id
        )
        if (action.payload.columnworkflowsAdded.length > 0) {
          state.columns.push(
            ...action.payload.columnworkflowsAdded.map((col) => col.id)
          )
        }
      }
    )

    // Column Actions
    builder
      .addCase(columnDeleteSelf, (state, action) => {
        state.columns = state.columns.filter((id) => id !== action.payload.id)
      })
      .addCase(columnInsertBelow, (state, action) => {
        const { id, newId } = action.payload
        const foundIndex = state.columns.indexOf(id)
        state.columns.splice(foundIndex + 1, 0, newId)
      })
  }
})

export const {
  deleteSelfSoft: workflowDeleteSelfSoft,
  restoreSelf: workflowRestoreSelf,
  createLock: workflowCreateLock,
  changeField: workflowChangeField,
  reorderColumns: workflowReorderColumns,
  reorderSection: workflowReorderSection
} = workflowSlice.actions

export default workflowSlice.reducer
