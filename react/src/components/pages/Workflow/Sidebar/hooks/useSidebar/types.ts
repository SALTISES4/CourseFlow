import { WorkflowType } from '@cf/api/gen'
import { WorkflowViewType } from '@cfPages/Workflow/types'

export type ConfigType = {
  workflowType?: WorkflowType | null
  viewType?: WorkflowViewType | null
}
