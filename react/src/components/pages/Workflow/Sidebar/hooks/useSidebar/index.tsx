import { Dispatch, SetStateAction, useContext, useEffect } from 'react'

import {
  WorkflowSidebarContext,
  WorkflowSidebarContextDispatch
} from './context'
import { ConfigType } from './types'

export function useWorkflowSidebar(
  config?: ConfigType
): [ConfigType, Dispatch<SetStateAction<ConfigType>>] {
  const workflowSidebar = useContext(WorkflowSidebarContext)
  const workflowSidebarDispatch = useContext(WorkflowSidebarContextDispatch)

  useEffect(() => {
    if (!config) {
      return
    }

    const shouldUpdate = Object.keys(config).some((key) => {
      const k = key as keyof ConfigType
      return config[k] !== workflowSidebar[k]
    })

    if (shouldUpdate) {
      workflowSidebarDispatch({ ...workflowSidebar, ...config })
    }
  }, [config, workflowSidebar, workflowSidebarDispatch])

  return [workflowSidebar, workflowSidebarDispatch]
}

export default useWorkflowSidebar
