import { CommonActions, SliceNamespace } from '@cfRedux/types/enumActions'
import { TProject, WorkspaceAppState } from '@cfRedux/types/type'
import { createAction, createSlice } from '@reduxjs/toolkit'

const initialState: TProject = {} as TProject
/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
export const replaceStoreData = createAction<{
  project: WorkspaceAppState['project'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

export const refreshStoreData = createAction<{
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

// import { CommonActions } from '@cfRedux/types/enumActions'
// import { TProject } from '@cfRedux/types/type'
// import { AnyAction } from '@reduxjs/toolkit'
// interface ReplaceStoreDataAction extends AnyAction {
//   type: CommonActions.REPLACE_STOREDATA
//   payload: { parentProject?: TProject }
// }
//
// interface RefreshStoreDataAction extends AnyAction {
//   type: CommonActions.REFRESH_STOREDATA
//   payload: { parentProject?: TProject }
// }
//
// interface ClearWorkflowDataAction extends AnyAction {
//   type: CommonActions.CLEAR_WORKFLOW_DATA
// }
// type ParentProjectActionTypes =
//   | ReplaceStoreDataAction
//   | RefreshStoreDataAction
//   | ClearWorkflowDataAction
//
// export default function parentProjectReducer(
//   state: TProject = {} as TProject,
//   action: ParentProjectActionTypes
// ): TProject {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA:
//       if (action.payload.parentProject) {
//         return action.payload.parentProject
//       }
//       return state
//
//     case CommonActions.REFRESH_STOREDATA:
//       if (action.payload.parentProject) {
//         return action.payload.parentProject
//       }
//       return state
//
//     // pretty obvious what this is doing
//     // BUT really it should be cleaning up all the workflow related objects
//     // columnworfklow
//     // node
//     // week etc
//     // ideally all workflow store is grouped under one entry in redux
//     case CommonActions.CLEAR_WORKFLOW_DATA:
//       return null
//
//     default:
//       return state
//   }
// }
