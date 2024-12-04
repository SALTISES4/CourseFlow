import { legacyWorkflowReducers, workspaceReducer } from '@cfRedux/Reducers'
import sidebarReducer from '@cfRedux/slices/sidebar.slice'
import viewsettingsReducer from '@cfRedux/slices/viewsettings.slice'
import { configureStore } from '@reduxjs/toolkit'
import { cfApi } from '@XMLHTTP/API/api'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

const store = configureStore({
  reducer: {
    ...legacyWorkflowReducers,
    workspace: workspaceReducer,
    sidebar: sidebarReducer,
    viewsettings: viewsettingsReducer,
    [cfApi.reducerPath]: cfApi.reducer
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cfApi.middleware)
})
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export default store
