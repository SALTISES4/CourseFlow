import React, { ReactNode } from 'react'
import WorkflowClass from '@cfPages/Workflow/Workflow'

export const WorkFlowConfigContext = React.createContext<ChildRenderer>( {} as ChildRenderer)

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
}
export class WorkFlowConfigProvider extends React.Component<PropsType> {
  constructor(props) {
    super(props)
    this.state = {
      value: {}, // The initial context value
      setValue: this.setValue // Method to update the context
    }
  }

  setValue = (newValue: WorkflowClass) => {
    const formattedValue = {
      task_choices: newValue.task_choices,
      time_choices: newValue.time_choices,
      read_only: newValue.read_only,
      context_choices: newValue.context_choices,
      outcome_type_choices: newValue.context_choices,
      strategy_classification_choices: newValue.strategy_classification_choices,
      change_field: newValue.change_field,
      workflowID: newValue.workflowID,
      unread_comments: newValue.unread_comments,
      add_comments: newValue.add_comments,
      view_comments: newValue.view_comments,
      selection_manager: newValue.selection_manager,

      lock_update: newValue.lock_update,
      micro_update: newValue.micro_update,
      is_strategy: newValue.is_strategy,
      show_assignments: newValue.show_assignments,
      column_choices: newValue.column_choices
    }

    this.setState({ value: formattedValue })
  }

  render() {
    return (
      <WorkFlowConfigContext.Provider
        //@ts-ignore
        value={this.state}
      >
        {this.props.children}
      </WorkFlowConfigContext.Provider>
    )
  }
}
