import { CfLock } from '@cf/types/common'
import { SliceNamespace } from '@cfRedux/types/enumActions'
import { TNode } from '@cfRedux/types/type'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

const initialState: TNode[] = []

const nodeSlice = createSlice({
  name: SliceNamespace.NODE,
  initialState,
  reducers: {
    changedColumn(
      state,
      action: PayloadAction<{ id: number; newColumn: number }>
    ) {
      state = state.map((item) => {
        if (item.id === action.payload.id) {
          return { ...item, column: action.payload.newColumn }
        }
        return item
      })
    },
    createLock(state, action: PayloadAction<{ id: number; lock: CfLock }>) {
      state = state.map((item) => {
        if (item.id === action.payload.id) {
          return { ...item, lock: action.payload.lock }
        }
        return item
      })
    },
    changeField(state, action: PayloadAction<{ id: number; lock: CfLock }>) {
      state = state.map((item) =>
        item.id === action.payload.id
          ? // no
            { ...item, ...action.payload.json }
          : item
      )
    }
  }
})

export default nodeSlice
export const { changedColumn, createLock, changeField } = nodeSlice.actions
