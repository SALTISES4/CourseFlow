import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useState
} from 'react'

import { ConfigType } from './types'

const initialState: ConfigType = {
  workflowType: null,
  viewType: null,
  permissionType: null,
  visibilityType: null
}

export const WorkflowSidebarContext = createContext<ConfigType>(initialState)

type DispatchType = Dispatch<SetStateAction<ConfigType>>
export const WorkflowSidebarContextDispatch = createContext<DispatchType>(
  () => null
)

export const WorkflowSidebarContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [config, setConfig] = useState(initialState)

  return (
    <WorkflowSidebarContext.Provider value={config}>
      <WorkflowSidebarContextDispatch.Provider value={setConfig}>
        {children}
      </WorkflowSidebarContextDispatch.Provider>
    </WorkflowSidebarContext.Provider>
  )
}
