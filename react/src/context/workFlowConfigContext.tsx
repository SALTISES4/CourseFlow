import React, { ReactNode, useState } from 'react'
import WorkflowClass from '@cfPages/Workflow/Workflow'

export const WorkFlowConfigContext = React.createContext<ChildRenderer>(
  {} as ChildRenderer
)

type ChildRenderer = {
  task_choices: any
  time_choices: any
  read_only: boolean
  context_choices: any
  outcome_type_choices: any
  strategy_classification_choices: any
  change_field: any
  workflowID: any
  unread_comments: any
  add_comments: any
  view_comments?: any
  selection_manager: any

  lock_update: any
  micro_update?: any
  is_strategy?: any
  show_assignments?: any
  column_choices: any
}
const initialWorkFlowConfig: ChildRenderer = {
  // Initialize all required fields
  // ...
} as ChildRenderer

// export type LegacyRendererProps = {
//   task_choices: any
//   time_choices: any
//   read_only: any
//   context_choices: any
//   outcome_type_choices: any
//   strategy_classification_choices: any
//   change_field: any
// }

type PropsType = {
  children: ReactNode
  initialValue: WorkflowClass
}

const WorkFlowConfigProvider = ({ children, initialValue }: PropsType) => {
  const formatInitialValue = (
    workflowInstance: WorkflowClass
  ): ChildRenderer => {
    // Process and format the workflowInstance
    // Return an object of type ChildRenderer
    const formattedValue = {
      task_choices: workflowInstance.task_choices,
      time_choices: workflowInstance.time_choices,
      read_only: workflowInstance.read_only,
      context_choices: workflowInstance.context_choices,
      outcome_type_choices: workflowInstance.context_choices,
      strategy_classification_choices:
        workflowInstance.strategy_classification_choices,
      change_field: workflowInstance.change_field,
      workflowID: workflowInstance.workflowID,
      unread_comments: workflowInstance.unread_comments,
      add_comments: workflowInstance.add_comments,
      view_comments: workflowInstance.view_comments,
      selection_manager: workflowInstance.selection_manager,

      lock_update: workflowInstance.lock_update,
      micro_update: workflowInstance.micro_update,
      is_strategy: workflowInstance.is_strategy,
      show_assignments: workflowInstance.show_assignments,
      column_choices: workflowInstance.column_choices
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
