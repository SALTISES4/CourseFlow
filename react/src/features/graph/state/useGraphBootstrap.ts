import type { AppDispatch } from '@cfRedux/store'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import type { GraphUuid } from './model/types'
import { bootstrapWorkflowGraph } from './thunks/bootstrapGraph.thunk'

export const useGraphBootstrap = (graphUuid: GraphUuid | null) => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!graphUuid) {
      return
    }
    dispatch(bootstrapWorkflowGraph(graphUuid))
  }, [dispatch, graphUuid])
}
