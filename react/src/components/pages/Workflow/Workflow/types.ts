export type WorkflowDetailViewDTO = {
  public_view: boolean
  user_id: number
  user_name: string
  user_role: number
  user_permission: number
  workflow_data_package: WorkflowDataPackage
  workflow_type: string
  workflow_model_id: number
  myColour: string
  changeFieldID: number
}

export type WorkflowDataPackage = {
  is_strategy: boolean
  column_choices: Choice[]
  context_choices: Choice[]
  task_choices: Choice[]
  time_choices: Choice[]
  outcome_type_choices: Choice[]
  outcome_sort_choices: Choice[]
  strategy_classification_choices: Choice[]
  project: Project
}

export type Choice = {
  type: number
  name: string
}

export type Project = {
  author: string
  author_id: number
  created_on: Date
  deleted: boolean
  deleted_on: Date
  description: string
  disciplines: any[]
  favourite: boolean
  id: number
  last_modified: string
  liveproject: null
  object_permission: ObjectPermission
  object_sets: any[]
  published: boolean
  title: string
  type: string
  workflowproject_set: number[]
}

export type ObjectPermission = {
  permission_type: number
  last_viewed: Date
}
