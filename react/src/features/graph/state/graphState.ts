import { combineReducers } from '@reduxjs/toolkit'

import {
  channelsReducer,
  edgesReducer,
  graphReducer,
  nodesReducer,
  sectionsReducer,
  tagsReducer,
  workflowReducer
} from './slices/canonical'
import { graphLoadReducer } from './slices/graphLoad.slice'
import { graphUiReducer } from './slices/graphUi.slice'
import { optimisticOpsReducer } from './slices/optimisticOps.slice'

export const graphCanonicalReducer = combineReducers({
  graph: graphReducer,
  workflow: workflowReducer,
  sections: sectionsReducer,
  channels: channelsReducer,
  nodes: nodesReducer,
  edges: edgesReducer,
  tags: tagsReducer
})

export const graphStateReducer = combineReducers({
  canonical: graphCanonicalReducer,
  graphLoad: graphLoadReducer,
  graphUi: graphUiReducer,
  optimisticOps: optimisticOpsReducer
})

export type GraphState = ReturnType<typeof graphStateReducer>
