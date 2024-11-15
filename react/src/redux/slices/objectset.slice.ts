import { ObjectSetActions, SliceNamespace } from '@cfRedux/types/enumActions'
import { TObjectSet } from '@cfRedux/types/type'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface ToggleObjectSetPayload {
  id: number
  hidden: boolean
}

const initialState: TObjectSet[] = []

const objectSetSlice = createSlice({
  name: SliceNamespace.OBJECTSET,
  initialState,
  reducers: {
    toggleObjectSet(state, action: PayloadAction<ToggleObjectSetPayload>) {
      const item = state.find((item) => item.id === action.payload.id)
      if (item) {
        item.hidden = action.payload.hidden
      }
    }
  }
})

export const { toggleObjectSet } = objectSetSlice.actions
export default objectSetSlice.reducer
