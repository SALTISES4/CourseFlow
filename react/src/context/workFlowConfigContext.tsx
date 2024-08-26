import React, { ReactNode } from 'react'
import { WorkflowClass } from '@cfPages/Workspace/Workflow'
import { ViewType } from '@cfModule/types/enum'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { AnyAction, EmptyObject, Store } from '@reduxjs/toolkit'

export const WorkFlowConfigContext = React.createContext<ChildRenderer>(
  {} as ChildRenderer
)

type ChildRenderer = {
  task_choices: any
  time_choices: any
  read_only: boolean
  context_choices: any
  outcome_type_choices: any
  outcome_sort_choices: any
  strategy_classification_choices: any
  change_field: any
  project: any
  workflowID: number
  unread_comments: any
  add_comments: any
  view_comments?: any
  selection_manager: SelectionManager

  lock_update: any
  micro_update?: any
  is_strategy?: any
  // show_assignments?: any
  column_choices: any
  // websocket: WebSocket

  // new
  user_id: number
  user_name: string
  view_type: ViewType

  // new new
  public_view: any

  // should be removed
  container: any
}
const initialWorkFlowConfig: ChildRenderer = {
  // Initialize all required fields
  // ...
} as ChildRenderer

type PropsType = {
  children: ReactNode
  initialValue: WorkflowClass
}

const WorkFlowConfigProvider = ({ children, initialValue }: PropsType) => {
  const formatInitialValue = (
    workflowInstance: WorkflowClass // @todo work on making this not a class, but a flat prop list
  ): ChildRenderer => {
    // Process and format the workflowInstance
    // Return an object of type ChildRenderer
    const formattedValue = {
      read_only: workflowInstance.read_only,

      task_choices: workflowInstance.task_choices, // // from  workflow/detail api call, workflow_data_package
      time_choices: workflowInstance.time_choices, // // from  workflow/detail api call, workflow_data_package
      context_choices: workflowInstance.context_choices, // from  workflow/detail api call, workflow_data_package
      outcome_type_choices: workflowInstance.context_choices, // from  workflow/detail api call, workflow_data_package
      outcome_sort_choices: workflowInstance.outcome_sort_choices, // from  workflow/detail api call, workflow_data_package
      column_choices: workflowInstance.column_choices, // workflow/detail api call, workflow_data_package
      strategy_classification_choices:
        workflowInstance.strategy_classification_choices, // from  workflow/detail api call, workflow_data_package

      project: workflowInstance.project, // from  workflow/detail api call, workflow_data_package
      workflowID: workflowInstance.workflowID, // from URL param, also   workflow/detail api call, workflow_data_package, workflow_model_id (?)
      is_strategy: workflowInstance.is_strategy, // workflow/detail api call, workflow_data_package

      //new
      user_id: workflowInstance.user_id, // workflow/detail api call, data_package
      user_name: workflowInstance.user_name, // workflow/detail api call, data_package
      view_type: workflowInstance.view_type, // workflow/detail api call, data_package
      public_view: workflowInstance.public_view, // workflow/detail api call, data_package

      unread_comments: workflowInstance.unread_comments, // supposedly coming back from API, but currently undefined

      add_comments: workflowInstance.add_comments, //permissions also set by user permissions from API
      view_comments: workflowInstance.view_comments, // permissions also set by user permissions from API

      // show_assignments: workflowInstance.show_assignments,

      // functions, these are the only items which actually belong to the 'workflow' react component class and as noted in the copponent, these
      // probably belong to something in the editable component area ...
      lock_update: workflowInstance.lock_update,
      micro_update: workflowInstance.micro_update,
      change_field: workflowInstance.change_field,

      selection_manager: workflowInstance.selection_manager, // define this as a singleton

      // to remove
      // there is no reason we're passing the full websocket object here - which component is directly accessing the websocket class?
      // this is being passed to the workflow 'base view' and the only reason is to pass it to connection bar
      // so connection bar can do some stuff
      // task: have a look at what connection bar needs to do its thing, add those props to state, pull that out of config
      // websocket: workflowInstance.websocket,
      container: workflowInstance.container,

      websocketIsConnected: workflowInstance.state.wsConnected
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
