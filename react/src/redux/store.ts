import authReducer from '@cf/features/auth/state/auth.slice'
import { graphStateReducer } from '@cf/features/graph/state'
import svglinkReducer from '@cf/features/graph/state/slices/svglink.slice'
import sidebarReducer from '@cf/features/sidebar/state/sidebar.slice'
import { listenerMiddleware } from '@cf/features/viewSettings/state/middleware/viewsettings.localstorage'
import viewsettingsReducer from '@cf/features/viewSettings/state/viewsettings.slice'
import { configureStore } from '@reduxjs/toolkit'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

const store = configureStore({
  reducer: {
    auth: authReducer,
    graph: graphStateReducer,
    sidebar: sidebarReducer,
    svglink: svglinkReducer,
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
