import { ConnectedUser } from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { CfObjectType } from '@cf/types/enum'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react'

export const WorkflowConfigContext = React.createContext<WorkflowContextType>(
  {} as WorkflowContextType
)

export type WorkflowContextType = {
  editableMethods: {
    lockUpdate: (
      obj: { objectId: number; objectType: CfObjectType },
      time: any,
      lock: boolean
    ) => void
    microUpdate: (obj: any) => void
    changeField: (id: any, objectType: any, field: any, value: any) => void
  }
  ws: {
    connectedUsers: ConnectedUser[]
    wsConnected: boolean
  }
  workflowView: WorkflowViewType
  setWorkflowView: Dispatch<SetStateAction<WorkflowViewType>>
}

type PropsType = {
  children: ReactNode
  initialValue: Pick<WorkflowContextType, 'editableMethods' | 'ws'>
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
      editableMethods: initialValue.editableMethods,
      ws: initialValue.ws
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
