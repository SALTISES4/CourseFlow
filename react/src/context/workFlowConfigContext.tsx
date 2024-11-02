import { ConnectedUser } from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { CfLock } from '@cf/types/common'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react'

export const WorkflowConfigContext = React.createContext<WorkflowContextType>(
  {} as WorkflowContextType
)

export type WorkflowContextType = {
  selectionManager: SelectionManager

  editableMethods: {
    lockUpdate: (obj: CfLock, time: any, lock: boolean) => void
    microUpdate: (obj: any) => void
    changeField: (id: any, objectType: any, field: any, value: any) => void
  }
  ws: {
    connectedUsers: ConnectedUser[]
    wsConnected: boolean
  }
  container: any
  workflowView: WorkflowViewType
  setWorkflowView: Dispatch<SetStateAction<WorkflowViewType>>
}

type PropsType = {
  children: ReactNode
  initialValue: Pick<
    WorkflowContextType,
    'editableMethods' | 'ws' | 'selectionManager'
  >
}

const WorkflowConfigProvider = ({ children, initialValue }: PropsType) => {
  // this default serves no direct purpose, and is  immediately overwritten by the workflow tab manager. But otherwise RR complains
  const [workflowViewType, setWorkflowViewType] = useState<WorkflowViewType>(
    WorkflowViewType.OVERVIEW
  )

  const formatInitialValue = (
    initialValue: PropsType['initialValue']
  ): Omit<WorkflowContextType, 'workflowView' | 'setWorkflowView'> => {
    const formattedValue = {
      selectionManager: initialValue.selectionManager,
      editableMethods: initialValue.editableMethods,
      ws: initialValue.ws,
      container: ''
    }
    return formattedValue
  }

  // Process the initialValue to get the formatted value
  const formattedValue = formatInitialValue(initialValue)

  return (
    <WorkflowConfigContext.Provider
      value={{
        ...formattedValue,
        workflowView: workflowViewType,
        setWorkflowView: setWorkflowViewType
      }}
    >
      {children}
    </WorkflowConfigContext.Provider>
  )
}

export default WorkflowConfigProvider
