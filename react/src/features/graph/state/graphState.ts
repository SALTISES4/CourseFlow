import { combineReducers } from '@reduxjs/toolkit'

import {
  channelsReducer,
  edgesReducer,
  graphReducer,
  nodesReducer,
  sectionsReducer,
  tagsReducer,
  workflowReducer
} from './canonical'
import { graphLoadReducer } from './graphLoad.slice'
import { graphUiReducer } from './graphUi.slice'
import { optimisticOpsReducer } from './optimisticOps.slice'

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
