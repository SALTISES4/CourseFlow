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
    createLock(state, action: PayloadAction<{ uuid: string; lock: CfLock }>) {
      const item = state.entities[action.payload.uuid]
      if (item) {
        item.lock = action.payload.lock
      }
    },
    deleteSelf(state, action: PayloadAction<{ uuid: string }>) {
      columnAdapter.removeOne(state, action.payload.uuid)
    },
    insertBelow(
      state,
      action: PayloadAction<{
        uuid: string | null
        newId: string
        duplicate?: string
      }>
    ) {
      const { newId, duplicate } = action.payload

      const column = duplicate
        ? state.entities[duplicate]
        : state.entities[state.uuids[0]]

      const clone = { ...column }
      const cloneTitle = column.title?.length
        ? column.title
        : column.columnTypeDisplay

      columnAdapter.addOne(state, {
        ...clone,
        uuid: newId,
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
        uuid: string
        data: Partial<TColumn>
      }>
    ) {
      columnAdapter.updateOne(state, {
        uuid: action.payload.uuid,
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
