import { graphStateReducer } from '@cf/features/graph/state'
import { listenerMiddleware } from '@cfRedux/middleware/viewsettings.localstorage'
import {
  dummyReducers,
  legacyWorkflowReducers,
  workspaceReducer
} from '@cfRedux/Reducers'
import authReducer from '@cfRedux/slices/auth.slice'
import sidebarReducer from '@cfRedux/slices/sidebar.slice'
import svgLinkReducer from '@cfRedux/slices/svglink.slice'
import viewsettingsReducer from '@cfRedux/slices/viewsettings.slice'
import { configureStore } from '@reduxjs/toolkit'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

const store = configureStore({
  reducer: {
    auth: authReducer,

    // New graph rewrite state (canonical/load/ui/ops).
    // This is the active target for new graph hydration.
    graph: graphStateReducer,

    // Legacy graph/workspace reducers remain mounted for deferred UI migration only.
    // They are quarantined from the new hydration path.
    ...legacyWorkflowReducers,
    ...dummyReducers,
    workspace: workspaceReducer,
    sidebar: sidebarReducer,
    svglink: svgLinkReducer,
    viewsettings: viewsettingsReducer
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().prepend(listenerMiddleware.middleware)
  }
})
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export default store
