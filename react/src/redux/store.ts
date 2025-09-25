import { listenerMiddleware } from '@cfRedux/middleware/viewsettings.localstorage'
import {
  dummyReducers,
  legacyWorkflowReducers,
  workspaceReducer
} from '@cfRedux/Reducers'
import sidebarReducer from '@cfRedux/slices/sidebar.slice'
import viewsettingsReducer from '@cfRedux/slices/viewsettings.slice'
import { configureStore } from '@reduxjs/toolkit'
import { cfApi } from '@XMLHTTP/API/api'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

const store = configureStore({
  reducer: {
    ...legacyWorkflowReducers,
    ...dummyReducers,
    workspace: workspaceReducer,
    sidebar: sidebarReducer,
    viewsettings: viewsettingsReducer,
    [cfApi.reducerPath]: cfApi.reducer
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(cfApi.middleware)
  }
})
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export default store
