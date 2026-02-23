import { CfLock } from '@cf/types/common'
import { defaultColumnSettings } from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import { CommonActions, SliceNamespace } from '@cfRedux/types/enumActions'
import { TColumn, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

// Define the initial state for the columns
/*******************************************************
 * ENTITY ADAPTOR
 *******************************************************/
export const columnAdapter = createEntityAdapter<TColumn>()
const initialState = columnAdapter.getInitialState()

/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
const replaceStoreData = createAction<{
  column: WorkspaceAppState['column'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

const refreshStoreData = createAction<{
  column: WorkspaceAppState['column'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICE
 *******************************************************/
const columnSlice = createSlice({
  name: SliceNamespace.COLUMN,
  initialState,
  reducers: {
    createLock(state, action: PayloadAction<{ id: number; lock: CfLock }>) {
      const item = state.entities[action.payload.id]
      if (item) {
        item.lock = action.payload.lock
      }
    },
    deleteSelf(state, action: PayloadAction<{ id: number }>) {
      columnAdapter.removeOne(state, action.payload.id)
    },
    insertBelow(
      state,
      action: PayloadAction<{
        id: number | null
        newId: number
        duplicate?: number
      }>
    ) {
      const { newId, duplicate } = action.payload

      const column = duplicate
        ? state.entities[duplicate]
        : state.entities[state.ids[0]]

      const clone = { ...column }
      const cloneTitle = column.title?.length
        ? column.title
        : column.columnTypeDisplay

      columnAdapter.addOne(state, {
        ...clone,
        id: newId,
        title: _t('Blank title'),
        description: '',
        colour: defaultColumnSettings['new-column'].colour,
        deleted: false,
        columnType: -1,
        columnTypeDisplay: '',
        comments: [],
        ...(duplicate && {
          title: `${cloneTitle} (copy)`,
          colour: clone.colour,
          description: clone.description,
          columnType: clone.columnType,
          columnTypeDisplay: clone.columnTypeDisplay
        })
      })
    },
    changeField(
      state,
      action: PayloadAction<{
        id: number
        data: Partial<TColumn>
      }>
    ) {
      columnAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.data
      })
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.column) {
          columnAdapter.setAll(state, action.payload.column)
        } else {
          columnAdapter.removeAll(state)
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.column) {
          columnAdapter.upsertMany(state, action.payload.column)
        }
      })
  }
})

export const {
  createLock: columnCreateLock,
  deleteSelf: columnDeleteSelf,
  insertBelow: columnInsertBelow,
  changeField: columnChangeField
} = columnSlice.actions

export default columnSlice.reducer
