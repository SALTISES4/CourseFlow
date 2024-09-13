import { ConnectedUser } from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { FieldChoice } from '@cf/types/common'
import { WorkflowViewType } from '@cf/types/enum'
import {
  WorkflowDetailViewDTO,
  WorkflowPermission
} from '@cfPages/Workspace/Workflow/types'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { EProject } from '@XMLHTTP/types/entity'
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react'

export const WorkFlowConfigContext = React.createContext<WorkFlowContextType>(
  {} as WorkFlowContextType
)

export type WorkFlowContextType = {
  public_view: boolean
  selectionManager: SelectionManager

  workflow: {
    workflowId: number
    project: EProject
    is_strategy?: boolean
    // verify
    unread_comments: any
    add_comments: any
    view_comments?: any
  }
  user: {
    user_name: string
    user_id: number
    isStudent: boolean
  }
  editableMethods: {
    lock_update: (obj: any, time: any, lock: any) => void
    micro_update: (obj: any) => void
    change_field: (id: any, object_type: any, field: any, value: any) => void
  }
  ws: {
    connectedUsers: ConnectedUser[]
    wsConnected: boolean
  }
  permissions: {
    projectPermission: number
    workflowPermission: WorkflowPermission
  }

  container: any
  workflowView: WorkflowViewType
  setWorkflowView: Dispatch<SetStateAction<WorkflowViewType>>
}

type PropsType = {
  children: ReactNode
  initialValue: Pick<
    WorkFlowContextType,
    'editableMethods' | 'permissions' | 'ws' | 'selectionManager'
  > & {
    workflowDetailResp: WorkflowDetailViewDTO
  }
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

    const wf_data = initialValue.workflowDetailResp.workflow_data_package
    const formattedValue = {
      public_view: initialValue.workflowDetailResp.public_view, // workflow/detail api call, data_package
      selectionManager: initialValue.selectionManager, // define this as a singleton

      // this is a partial list of needed values, directly from the API query, we should probably make a Pick
      workflow: {
        workflowId: initialValue.workflowDetailResp.workflow_model_id, // from URL param, also   workflow/detail api call, workflow_data_package, workflow_model_id (?)
        project: wf_data.project, // from  workflow/detail api call, workflow_data_package
        isStrategy: wf_data.is_strategy, // workflow/detail api call, workflow_data_package

        // @ts-ignore
        unread_comments: wf_data.unread_comments ?? [], // supposedly coming back from API, but currently undefined

        add_comments:
          // @ts-ignore
          wf_data.add_comments ?? // this is not confirmed
          [], //permissions also set by user permissions from API
        view_comments:
          // @ts-ignore
          initialValue.workflowDetailResp.workflow_data_package.view_comments ?? // this is not confirmed
          [] // permissions also set by user permissions from API
      },
      // @todo make the user a better defined object
      user: {
        user_id: initialValue.workflowDetailResp.user_id, // workflow/detail api call, data_package
        user_name: initialValue.workflowDetailResp.user_name, // workflow/detail api call, data_package
        isStudent: false // @todo
      },

      // functions, these are the only items which actually belong to the 'workflow' react component class and as noted in the copponent, these
      // probably belong to something in the editable component area ...
      editableMethods: initialValue.editableMethods,

      ws: initialValue.ws,
      permissions: initialValue.permissions,

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
