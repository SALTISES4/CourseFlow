import { ConnectedUser } from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { CfObjectType } from '@cf/types/enum'
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react'

import { WorkflowViewType } from '../components/pages/Workflow/types'

export const WorkflowConfigContext = React.createContext<WorkflowContextType>(
  {} as WorkflowContextType
)

export type WorkflowContextType = {
  editableMethods: {
    lockUpdate: (
      obj: { objectuuid: string; objectType: CfObjectType },
      time: any,
      lock: boolean
    ) => void
    microUpdate: (obj: any) => void
    changeField: (uuid: any, objectType: any, field: any, value: any) => void
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
