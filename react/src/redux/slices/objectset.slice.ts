import {
  CommonActions,
  SliceNamespace
} from '@cfRedux/types/enumActions'
import { TObjectSet, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

interface ToggleObjectSetPayload {
  id: number
  hidden: boolean
}

export const objectSetAdapter = createEntityAdapter<TObjectSet>()
const initialState = objectSetAdapter.getInitialState()
/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
export const replaceStoreData = createAction<{
  objectSet: WorkspaceAppState['objectSet'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

export const refreshStoreData = createAction<{
  objectSet: WorkspaceAppState['objectSet'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

const objectSetSlice = createSlice({
  name: SliceNamespace.OBJECTSET,
  initialState,
  reducers: {
    toggleObjectSet: (state, action: PayloadAction<ToggleObjectSetPayload>) => {
      objectSetAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { hidden: action.payload.hidden }
      })
    }
  },
  extraReducers: (builder) => {
    builder
      /*******************************************************
       * COMMON
       *******************************************************/
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.objectSet) {
          objectSetAdapter.setAll(state, action.payload.objectSet)
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.objectSet) {
          objectSetAdapter.upsertMany(state, action.payload.objectSet)
        }
      })
  }
})

export const { toggleObjectSet } = objectSetSlice.actions

export default objectSetSlice.reducer
