import { swapInPlace } from '@cf/components/views/WorkflowView/WorkflowEditView/utility'
import {
  ColumnActions,
  ColumnWorkflowActions,
  CommonActions,
  NodeActions,
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

const initialState: TWorkflow = {} as TWorkflow

/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
export const replaceStoreData = createAction<{
  workflow: WorkspaceAppState['workflow'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

export const refreshStoreData = createAction<{
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

      state.columns = swapInPlace(state.columns, moveIndex, toIndex)
    },

    // workflow reorder weeks
    reorderWeeks(
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) {
      const { fromIndex, toIndex } = action.payload

      if (fromIndex === toIndex) {
        return
      }

      const moved = state.weeks.splice(fromIndex, 1)
      state.weeks.splice(toIndex, 0, moved[0])
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
        OutcomeWorkflowActions.CHANGE_ID,
        (state, action: PayloadAction<{ oldId: number; newId: number }>) => {
          const index = state.outcomes.indexOf(action.payload.oldId)
          if (index >= 0) {
            state.outcomes.splice(index, 1, action.payload.newId)
          }
        }
      )
      .addCase(
        OutcomeWorkflowActions.MOVED_TO,
        (state, action: PayloadAction<{ id: number; newIndex: number }>) => {
          const index = state.outcomes.indexOf(action.payload.id)
          if (index >= 0) {
            state.outcomes.splice(index, 1)
            state.outcomes.splice(action.payload.newIndex, 0, action.payload.id)
          }
        }
      )

    // Column Workflow Actions
    builder
      .addCase(
        ColumnWorkflowActions.CHANGE_ID,
        (state, action: PayloadAction<{ oldId: number; newId: number }>) => {
          const index = state.columns.indexOf(action.payload.oldId)
          if (index >= 0) {
            state.columns.splice(index, 1, action.payload.newId)
          }
        }
      )
      .addCase(
        ColumnWorkflowActions.MOVED_TO,
        (state, action: PayloadAction<{ id: number; newIndex: number }>) => {
          const index = state.columns.indexOf(action.payload.id)
          if (index >= 0) {
            state.columns.splice(index, 1)
            state.columns.splice(action.payload.newIndex, 0, action.payload.id)
          }
        }
      )

    // Week Workflow Actions
    builder
      .addCase(
        WeekWorkflowActions.MOVED_TO,
        (state, action: PayloadAction<{ id: number; newIndex: number }>) => {
          const index = state.weeks.indexOf(action.payload.id)
          if (index >= 0) {
            state.weeks.splice(index, 1)
            state.weeks.splice(action.payload.newIndex, 0, action.payload.id)
          }
        }
      )
      .addCase(
        WeekWorkflowActions.CHANGE_ID,
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
        WeekActions.DELETE_SELF,
        (state, action: PayloadAction<{ parentId: number }>) => {
          state.weeks = state.weeks.filter(
            (id) => id !== action.payload.parentId
          )
        }
      )
      .addCase(
        WeekActions.RESTORE_SELF,
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
        WeekActions.INSERT_BELOW,
        (
          state,
          action: PayloadAction<{ newThrough: { rank: number; id: number } }>
        ) => {
          state.weeks.splice(
            action.payload.newThrough.rank,
            0,
            action.payload.newThrough.id
          )
        }
      )

    // Outcome Base Actions
    builder
      .addCase(
        OutcomeBaseActions.DELETE_SELF,
        (state, action: PayloadAction<{ parentId: number }>) => {
          state.outcomes = state.outcomes.filter(
            (id) => id !== action.payload.parentId
          )
        }
      )
      .addCase(
        OutcomeBaseActions.RESTORE_SELF,
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
        OutcomeActions.NEW_OUTCOME,
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
      StrategyActions.ADD_STRATEGY,
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

    // Node Actions
    builder.addCase(
      NodeActions.NEW_NODE,
      (state, action: PayloadAction<{ columnworkflow: { id: number } }>) => {
        if (!state.columns.includes(action.payload.columnworkflow.id)) {
          state.columns.push(action.payload.columnworkflow.id)
        }
      }
    )

    // Column Actions
    builder
      .addCase(
        ColumnActions.RESTORE_SELF,
        (
          state,
          action: PayloadAction<{
            throughparentIndex: number
            throughparentId: number
          }>
        ) => {
          state.columns.splice(
            action.payload.throughparentIndex,
            0,
            action.payload.throughparentId
          )
        }
      )
      .addCase(
        ColumnActions.DELETE_SELF,
        (state, action: PayloadAction<{ parentId: number }>) => {
          state.columns = state.columns.filter(
            (id) => id !== action.payload.parentId
          )
        }
      )
      .addCase(
        ColumnActions.INSERT_BELOW,
        (
          state,
          action: PayloadAction<{ newThrough: { rank: number; id: number } }>
        ) => {
          state.columns.splice(
            action.payload.newThrough.rank,
            0,
            action.payload.newThrough.id
          )
        }
      )
  }
})

export const {
  deleteSelfSoft: workflowDeleteSelfSoft,
  restoreSelf: workflowRestoreSelf,
  createLock: workflowCreateLock,
  changeField: workflowChangeField,
  reorderColumns: workflowReorderColumns,
  reorderWeeks: workflowReorderWeeks
} = workflowSlice.actions

export default workflowSlice.reducer
