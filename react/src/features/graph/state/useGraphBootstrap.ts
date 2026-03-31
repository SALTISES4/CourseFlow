import type { AppDispatch } from '@cfRedux/store'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { bootstrapWorkflowGraph } from './bootstrapGraph.thunk'
import type { WorkflowUuid } from './model/types'

export const useGraphBootstrap = (workflowUuid: WorkflowUuid | null) => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!workflowUuid) {
      return
    }
    dispatch(bootstrapWorkflowGraph(workflowUuid))
  }, [dispatch, workflowUuid])
}
