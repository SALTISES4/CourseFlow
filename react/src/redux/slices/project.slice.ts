import { CommonActions, SliceNamespace } from '@cfRedux/types/enumActions'
import { TProject, WorkspaceAppState } from '@cfRedux/types/type'
import { createAction, createSlice } from '@reduxjs/toolkit'

const initialState: TProject = {} as TProject
/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
const replaceStoreData = createAction<{
  project: WorkspaceAppState['project'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

const refreshStoreData = createAction<{
  project: WorkspaceAppState['project'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICES
 *******************************************************/
const projectSlice = createSlice({
  name: SliceNamespace.PROJECT,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.project) {
          return action.payload.project || state
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.project) {
          return action.payload.project
        }
      })
      .addCase(CommonActions.CLEAR_WORKFLOW_DATA, () => null)
  }
})

export default projectSlice.reducer
