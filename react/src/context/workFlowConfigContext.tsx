import { ConnectedUser } from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { WorkflowViewType } from '@cf/types/enum'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react'

export const WorkFlowConfigContext = React.createContext<WorkFlowContextType>(
  {} as WorkFlowContextType
)

export type WorkFlowContextType = {
  selectionManager: SelectionManager

  editableMethods: {
    lockUpdate: (obj: any, time: any, lock: any) => void
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
    WorkFlowContextType,
    'editableMethods' | 'ws' | 'selectionManager'
  >
}

const WorkFlowConfigProvider = ({ children, initialValue }: PropsType) => {
  // this default serves not purpose, it's immediately overwritten by the workflow tab manager, but otherwise RR complains with verbosity...
  const [workflowViewType, setWorkflowViewType] = useState<WorkflowViewType>(
    WorkflowViewType.WORKFLOW
  )

  const formatInitialValue = (
    initialValue: PropsType['initialValue']
  ): Omit<WorkFlowContextType, 'workflowView' | 'setWorkflowView'> => {
    // Process and format the workflowInstance
    // Return an object of type ChildRenderer

    const formattedValue = {
      selectionManager: initialValue.selectionManager, // define this as a singleton

      // functions, these are the only items which actually belong to the 'workflow' react component class and as noted in the copponent, these
      // probably belong to something in the editable component area ...
      editableMethods: initialValue.editableMethods,

      ws: initialValue.ws,
      container: ''
    }
    return formattedValue
  }

  // Process the initialValue to get the formatted value
  const formattedValue = formatInitialValue(initialValue)

  return (
    <WorkFlowConfigContext.Provider
      value={{
        ...formattedValue,
        workflowView: workflowViewType,
        setWorkflowView: setWorkflowViewType
      }}
    >
      {children}
    </WorkFlowConfigContext.Provider>
  )
}

export default WorkFlowConfigProvider
