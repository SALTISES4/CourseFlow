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


// import { ObjectSetActions } from '@cfRedux/types/enumActions'
// import { TObjectSet } from '@cfRedux/types/type'
// import { AnyAction } from '@reduxjs/toolkit'
//
// interface ToggleObjectSetAction extends AnyAction {
//   type: ObjectSetActions.TOGGLE_OBJECT_SET
//   payload: {
//     id: number
//     hidden: boolean
//   }
// }
//
// export default function objectSetReducer(
//   state: TObjectSet[] = [],
//   action: ToggleObjectSetAction
// ): TObjectSet[] {
//   switch (action.type) {
//     case ObjectSetActions.TOGGLE_OBJECT_SET:
//       return state.map((item) =>
//         item.id === action.payload.id
//           ? { ...item, hidden: action.payload.hidden }
//           : item
//       )
//
//     default:
//       return state
//   }
// }
