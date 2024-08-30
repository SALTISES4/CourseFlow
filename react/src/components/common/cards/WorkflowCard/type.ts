import { ESectionObject } from '@XMLHTTP/types/entity'

export type WorkflowCardProps = {
  workflowData: ESectionObject
  updateWorkflow?: any
  selected?: any
  noHyperlink?: any
  readOnly?: any
  projectData?: any
  selectAction?: any
  context?: any
  objectType?: any
  no_hyperlink?: any
  type?: any // @todo i don't think this is used
  dispatch?: any // @todo i don't think this is used
}

export type CreateDiv = {
  current: null
}

export type State = {
  project_data: ESectionObject[]
}
