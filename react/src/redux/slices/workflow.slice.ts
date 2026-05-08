import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeWorkflowActions,
  SectionActions,
  SectionWorkflowActions,
  SliceNamespace,
  StrategyActions
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
    createLock(state, action: PayloadAction<{ uuid: string; lock: any }>) {
      if (state.uuid === action.payload.uuid) {
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

    // sections / sections
    reorderSection(
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) {
      const { fromIndex, toIndex } = action.payload

      if (fromIndex === toIndex) {
        return
      }

      const moved = state.sections.splice(fromIndex, 1)
      state.sections.splice(toIndex, 0, ...moved)
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
        (
          state,
          action: PayloadAction<{ oldUuid: string; newUuid: string }>
        ) => {
          const index = state.outcomes.indexOf(action.payload.oldId)
          if (index >= 0) {
            state.outcomes.splice(index, 1, action.payload.newId)
          }
        }
      )
      .addCase(
        OutcomeWorkflowActions.MOVED_TO as string,
        (state, action: PayloadAction<{ uuid: string; newIndex: number }>) => {
          const index = state.outcomes.indexOf(action.payload.uuid)
          if (index >= 0) {
            state.outcomes.splice(index, 1)
            state.outcomes.splice(
              action.payload.newIndex,
              0,
              action.payload.uuid
            )
          }
        }
      )

    // Section Workflow Actions
    builder
      .addCase(
        SectionWorkflowActions.MOVED_TO as string,
        (state, action: PayloadAction<{ uuid: string; newIndex: number }>) => {
          const index = state.sections.indexOf(action.payload.uuid)
          if (index >= 0) {
            state.sections.splice(index, 1)
            state.sections.splice(
              action.payload.newIndex,
              0,
              action.payload.uuid
            )
          }
        }
      )
      .addCase(
        SectionWorkflowActions.CHANGE_ID as string,
        (
          state,
          action: PayloadAction<{ olduuid: string; newuuid: string }>
        ) => {
          const index = state.sections.indexOf(action.payload.oldId)
          if (index >= 0) {
            state.sections.splice(index, 1, action.payload.newId)
          }
        }
      )

    // Section Actions
    builder
      .addCase(
        SectionActions.DELETE_SELF as string,
        (state, action: PayloadAction<{ uuid: string }>) => {
          state.sections = state.sections.filter(
            (id) => id !== action.payload.uuid
          )
        }
      )
      .addCase(
        SectionActions.RESTORE_SELF as string,
        (
          state,
          action: PayloadAction<{
            throughparentIndex: number
            throughparentuuid: string
          }>
        ) => {
          state.sections.splice(
            action.payload.throughparentIndex,
            0,
            action.payload.throughparentId
          )
        }
      )
      .addCase(
        SectionActions.INSERT_BELOW as string,
        (state, action: PayloadAction<{ uuid: string; newuuid: string }>) => {
          const { id, newId } = action.payload
          const insertAtIndex = state.sections.indexOf(id)
          state.sections.splice(insertAtIndex + 1, 0, newId)
        }
      )

    // Outcome Base Actions
    builder
      .addCase(
        OutcomeBaseActions.DELETE_SELF as string,
        (state, action: PayloadAction<{ parentuuid: string }>) => {
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
            throughparentuuid: string
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
            newThrough: { rank: number; uuid: string; workflow: number }
          }>
        ) => {
          if (state.uuid !== action.payload.newThrough.workflow) {
            return
          }
          state.outcomes.splice(
            action.payload.newThrough.rank,
            0,
            action.payload.newThrough.uuid
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
          newThrough: { uuid: string }
          columnworkflowsAdded: any[]
        }>
      ) => {
        state.sections.splice(
          action.payload.index,
          0,
          action.payload.newThrough.uuid
        )
        if (action.payload.columnworkflowsAdded.length > 0) {
          state.columns.push(
            ...action.payload.columnworkflowsAdded.map((col) => col.uuid)
          )
        }
      }
    )

    // Column Actions
    builder
      .addCase(columnDeleteSelf, (state, action) => {
        state.columns = state.columns.filter((id) => id !== action.payload.uuid)
      })
      .addCase(columnInsertBelow, (state, action) => {
        const { id, newId } = action.payload

        // if no "target" id, we're just adding to the end
        if (!id) {
          state.columns.push(newId)
          return
        }

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
