import { EWorkflowDataPackage } from '@XMLHTTP/types'

export type WorkflowDetailViewDTO = {
  workflow_data_package: EWorkflowDataPackage
  // @todo making all these props optional tempararily becuase WorkflowComparison extends Workflow
  public_view?: boolean
  user_id?: number
  user_name?: string
  user_permission?: number
  workflow_type?: string
  workflow_model_id: number
  myColour?: string
  changeFieldID?: number
}

export type WorkflowPermission = {
  readOnly: boolean
  viewComments: boolean
  addComments: boolean
  canView: boolean
}
