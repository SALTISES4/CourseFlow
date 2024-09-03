import React, { ReactNode } from 'react'
import { ViewType } from '@cf/types/enum'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { ConnectedUser } from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import {
  WorkflowDetailViewDTO,
  WorkflowPermission
} from '@cfPages/Workspace/Workflow/types'
import { FieldChoice } from '@cf/types/common'
import { EProject } from '@XMLHTTP/types/entity'

export const WorkFlowConfigContext = React.createContext<WorkFlowContextType>(
  {} as WorkFlowContextType
)

export type WorkFlowContextType = {
  viewType: ViewType
  public_view: boolean

  selectionManager: SelectionManager

  workflow: {
    workflowID: number
    choices: {
      task_choices: FieldChoice[]
      time_choices: FieldChoice[]
      context_choices: FieldChoice[]
      strategy_classification_choices: FieldChoice[]
      outcome_type_choices: FieldChoice[]
      outcome_sort_choices: FieldChoice[]
      column_choices: FieldChoice[]
    }
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
}

type PropsType = {
  children: ReactNode
  initialValue: Pick<
    WorkFlowContextType,
    'editableMethods' | 'permissions' | 'ws' | 'selectionManager' | 'viewType'
  > & {
    workflowDetailResp: WorkflowDetailViewDTO
  }
}

const WorkFlowConfigProvider = ({ children, initialValue }: PropsType) => {
  const formatInitialValue = (
    initialValue: PropsType['initialValue']
  ): WorkFlowContextType => {
    // Process and format the workflowInstance
    // Return an object of type ChildRenderer

    const wf_data = initialValue.workflowDetailResp.workflow_data_package
    const formattedValue = {
      viewType: initialValue.viewType,
      public_view: initialValue.workflowDetailResp.public_view, // workflow/detail api call, data_package
      selectionManager: initialValue.selectionManager, // define this as a singleton

      // this is a partial list of needed values, directly from the API query, we should probably make a Pick
      workflow: {
        workflowID: initialValue.workflowDetailResp.workflow_model_id, // from URL param, also   workflow/detail api call, workflow_data_package, workflow_model_id (?)
        project: wf_data.project, // from  workflow/detail api call, workflow_data_package
        isStrategy: wf_data.is_strategy, // workflow/detail api call, workflow_data_package

        // @todo organize choices better
        choices: {
          task_choices: wf_data.task_choices, // // from  workflow/detail api call, workflow_data_package
          time_choices: wf_data.time_choices, // // from  workflow/detail api call, workflow_data_package
          context_choices: wf_data.context_choices, // from  workflow/detail api call, workflow_data_package
          outcome_type_choices: wf_data.context_choices, // from  workflow/detail api call, workflow_data_package
          outcome_sort_choices: wf_data.outcome_sort_choices, // from  workflow/detail api call, workflow_data_package
          column_choices: wf_data.column_choices, // workflow/detail api call, workflow_data_package
          strategy_classification_choices:
            wf_data.strategy_classification_choices // from  workflow/detail api call, workflow_data_package
        },

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
    <WorkFlowConfigContext.Provider value={formattedValue}>
      {children}
    </WorkFlowConfigContext.Provider>
  )
}

export default WorkFlowConfigProvider
