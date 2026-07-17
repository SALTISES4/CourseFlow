import { combineReducers } from '@reduxjs/toolkit'

import {
  channelsReducer,
  edgesReducer,
  graphReducer,
  nodesReducer,
  outcomesReducer,
  sectionsReducer,
  tagsReducer,
  workflowReducer
} from './slices/canonical'
import { graphLoadReducer } from './slices/graphLoad.slice'
import { graphUiReducer } from './slices/graphUi.slice'
import { optimisticOpsReducer } from './slices/optimisticOps.slice'
import { outcomeUiReducer } from './slices/outcomeUi.slice'

export const graphCanonicalReducer = combineReducers({
  graph: graphReducer,
  workflow: workflowReducer,
  sections: sectionsReducer,
  channels: channelsReducer,
  nodes: nodesReducer,
  edges: edgesReducer,
  tags: tagsReducer,
  outcomes: outcomesReducer
})

export const graphStateReducer = combineReducers({
  canonical: graphCanonicalReducer,
  graphLoad: graphLoadReducer,
  graphUi: graphUiReducer,
  outcomeUi: outcomeUiReducer,
  optimisticOps: optimisticOpsReducer
})

export type GraphState = ReturnType<typeof graphStateReducer>
