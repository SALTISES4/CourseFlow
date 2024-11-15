import { legacyWorkflowReducers } from '@cfRedux/Reducers'
import columnReducer from '@cfRedux/slices/column.slice'
import nodeReducer from '@cfRedux/slices/node.slice'
import nodelinkReducer from '@cfRedux/slices/nodelink.slice'
import sidebarReducer from '@cfRedux/slices/sidebar.slice'
import strategyReducer from '@cfRedux/slices/strategy.slice'
import weekReducer from '@cfRedux/slices/week.slice'
import workflowReducer from '@cfRedux/slices/workflow.slice'
import { configureStore } from '@reduxjs/toolkit'
import { cfApi } from '@XMLHTTP/API/api'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

const store = configureStore({
  reducer: {
    ...legacyWorkflowReducers,
    sidebar: sidebarReducer,
    workflow: workflowReducer,
    column: columnReducer,
    week: weekReducer,
    node: nodeReducer,
    nodelink: nodelinkReducer,
    strategy: strategyReducer,

    [cfApi.reducerPath]: cfApi.reducer
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cfApi.middleware)
})

export default store
