import { EProject } from '@XMLHTTP/types/entity'

export type WorkflowDetailViewDTO = {
  // workflowDataPackage: EWorkflowDataPackage
  // @todo making all these props optional tempararily becuase WorkflowComparison extends Workflow
  // publicView?: boolean
  userId?: number
  userName?: string
  // userPermission?: number
  // workflow_type?: string
  // workflow_model_id: number
  // myColour?: string
  changeFieldID?: number
}

export type ProjectViewDTO = {
  projectData: EProject
  userPermission: number // not always
  userId: number
  userRole: number
  userName: string
  isStrategy: boolean
  publicView: boolean
  changeFieldID: number
  // myColour: string
}
