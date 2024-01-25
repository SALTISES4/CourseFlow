import { EProject } from '@XMLHTTP/types/entity'

export type WorkflowComparisonViewDTO = {
  project_data: EProject
  is_strategy: boolean
  user_permission: number
  user_role: number
  public_view: boolean
  user_name: string
  user_id: number
  myColour: string
  changeFieldID: number
}
