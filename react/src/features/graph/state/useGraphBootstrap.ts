import type { AppDispatch } from '@cfRedux/store'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { bootstrapWorkflowGraph } from './bootstrapGraph.thunk'
import type { GraphUuid } from './model/types'

export const useGraphBootstrap = (graphUuid: GraphUuid | null) => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!graphUuid) {
      return
    }
    dispatch(bootstrapWorkflowGraph(graphUuid))
  }, [dispatch, graphUuid])
}
