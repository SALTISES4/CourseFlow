import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import { CommonActions, SliceNamespace } from '@cfRedux/types/enumActions'
import { AppState, TColumn } from '@cfRedux/types/type'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

// Define the initial state for the columns
const initialState: TColumn[] = []
const updateEntity = <T, S>(
  state: T,
  action: PayloadAction<{
    id: number
    data: Pick<S>
  }>
) => {
  return state.map((item) =>
    item.id === action.payload.id ? { ...item, ...action.payload.data } : item
  )
}

const columnSlice = createSlice<AppState['column']>({
  name: SliceNamespace.COLUMN,
  initialState,
  reducers: {
    createLock(state, action: PayloadAction<{ id: number; lock: CfLock }>) {
      const index = state.findIndex((item) => item.id === action.payload.id)
      if (index !== -1) {
        state[index].lock = action.payload.lock
      }
    },
    deleteSelf(state, action: PayloadAction<{ id: number }>) {
      return state.filter((item) => item.id !== action.payload.id)
    },
    deleteSelfSoft(state, action: PayloadAction<{ id: number }>) {
      const index = state.findIndex((item) => item.id === action.payload.id)
      if (index !== -1) {
        state[index].deleted = true
        state[index].deletedOn = _t('This session') // Check translation context usage
      }
    },
    restoreSelf(state, action: PayloadAction<{ id: number }>) {
      const index = state.findIndex((item) => item.id === action.payload.id)
      if (index !== -1) {
        state[index].deleted = false
      }
    },
    insertBelow(state, action: PayloadAction<{ newModel: TColumn }>) {
      state.push(action.payload.newModel)
    },
    changeField: updateEntity,

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
    /*******************************************************
     * COMMON
     *******************************************************/
    builder
      .addCase(
        CommonActions.REPLACE_STOREDATA,
        (state, action: PayloadAction<{ column?: TColumn[] }>) => {
          if (action.payload.column) {
            return action.payload.column
          }
        }
      )
      .addCase(
        /*******************************************************
         * COMMON
         *******************************************************/
        CommonActions.REFRESH_STOREDATA,
        (state, action: PayloadAction<{ column: TColumn[] }>) => {
          if (action.payload.column) {
            return action.payload.column.reduce(
              (newState, newObj) => {
                const index = newState.findIndex(
                  (item) => item.id === newObj.id
                )
                if (index !== -1) {
                  newState[index] = newObj
                } else {
                  newState.push(newObj)
                }
                return newState
              },
              [...state]
            )
          }
        }
      )
  }
})

export const {
  replaceStoreData: columnReplaceStoreData,
  refreshStoreData: columnRefreshStoreData,
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
