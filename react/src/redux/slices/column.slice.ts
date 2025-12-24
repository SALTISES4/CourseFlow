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
    deleteSelfSoft(state, action: PayloadAction<{ id: number }>) {
      const item = state.entities[action.payload.id]
      if (item) {
        item.deleted = true
        item.deletedOn = _t('This session') // Check translation context usage
      }
    },
    restoreSelf(state, action: PayloadAction<{ id: number }>) {
      const item = state.entities[action.payload.id]
      if (item) {
        item.deleted = false
      }
    },
    insertBelow(
      state,
      action: PayloadAction<{ id: number; duplicate?: number }>
    ) {
      const { id, duplicate } = action.payload
      const column = duplicate
        ? state.entities[duplicate]
        : state.entities[state.ids[0]]

      const clone = { ...column }
      const cloneTitle = column.title?.length
        ? column.title
        : column.columnTypeDisplay

      columnAdapter.addOne(state, {
        ...clone,
        id,
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
    },

    reloadComments(
      state,
      action: PayloadAction<{ id: number; commentData: any }>
    ) {
      const index = state.findIndex((item) => item.id === action.payload.id)
      if (index !== -1) {
        state[index].comments = action.payload.commentData
      }
    },
    //     case NodeActions.NEW_NODE:
    newNode(state, action: PayloadAction<{ column: TColumn }>) {
      if (!state.some((item) => item.id === action.payload.column.id)) {
        state.push(action.payload.column)
      }
    },
    // case StrategyActions.ADD_STRATEGY:
    addStrategy(state, action: PayloadAction<{ columnsAdded: TColumn[] }>) {
      if (action.payload.columnsAdded.length > 0) {
        state.push(...action.payload.columnsAdded)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      /*******************************************************
       * COMMON
       *******************************************************/
      .addCase(replaceStoreData, (state, action) => {
        return action.payload.column || state
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
  deleteSelfSoft: columnDeleteSelfSoft,
  restoreSelf: columnRestoreSelf,
  insertBelow: columnInsertBelow,
  changeField: columnChangeField,
  reloadComments: columnReloadNode,
  newNode: columnNeNode,
  addStrategy: columnAddStrategy
} = columnSlice.actions

export default columnSlice.reducer
