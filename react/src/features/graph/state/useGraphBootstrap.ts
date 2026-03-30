import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { bootstrapWorkflowGraph } from './bootstrapGraph.thunk'
import type { WorkflowId } from './model/types'

/**
 * Lightweight bootstrap hook for workflow graph pages.
 * Starts parallel read-side resource loading for one workflow.
 */
export const useGraphBootstrap = (workflowId: WorkflowId | null) => {
  const dispatch = useDispatch<any>()

  useEffect(() => {
    if (!workflowId) {
      return
    }
    dispatch(bootstrapWorkflowGraph(workflowId))
  }, [dispatch, workflowId])
}
