import { Workflow } from '@cfModule/types/common'

export type WorkflowCardProps = {
  workflowData: Workflow
  updateWorkflow?: any
  selected?: any
  noHyperlink?: any
  userRole?: any
  readOnly?: any
  projectData?: any
  selectAction?: any
}

export type CreateDiv = {
  current: null
}

export type State = {
  project_data: Workflow[]
}
