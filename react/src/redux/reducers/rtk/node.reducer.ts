import { NodeActions } from '@cfRedux/types/enumActions'
import { TNode } from '@cfRedux/types/type'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface NodeState {
  nodes: TNode[]
}

const initialState: NodeState = {
  nodes: []
}

const nodeSlice = createSlice({
  name: 'node',
  initialState,
  reducers: {
    changedColumn(
      state,
      action: PayloadAction<{ id: number; newColumn: number }>
    ) {
      state.nodes = state.nodes.map((item) => {
        if (item.id === action.payload.id) {
          return { ...item, column: action.payload.newColumn }
        }
        return item
      })
    }
  }
})

export default nodeSlice.reducer
export const { changedColumn } = nodeSlice.actions
