import { combineReducers } from '@reduxjs/toolkit'

import {
  channelsReducer,
  edgesReducer,
  nodesReducer,
  sectionsReducer,
  tagsReducer,
  workflowMetaReducer
} from './canonical'
import { graphLoadReducer } from './graphLoad.slice'
import { graphUiReducer } from './graphUi.slice'
import { optimisticOpsReducer } from './optimisticOps.slice'

export const graphCanonicalReducer = combineReducers({
  workflowMeta: workflowMetaReducer,
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
