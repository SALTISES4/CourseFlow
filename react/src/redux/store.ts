// import './wdyr'
import { rootSidebarReducers, rootWorkflowReducers } from '@cfRedux/Reducers'
import { configureStore } from '@reduxjs/toolkit'
import { cfApi } from '@XMLHTTP/API/api'
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

const store = configureStore({
  reducer: {
    // workflow: Reducers.rootWorkflowReducer,
    // outcome: Reducers.rootOutcomeReducer,
    ...rootWorkflowReducers,
    ...rootSidebarReducers,
    [cfApi.reducerPath]: cfApi.reducer
  },
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools only in non-production environments
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cfApi.middleware)
})

export default store
