export type NodeForm = {
  title?: string
  description?: string
  contextType?: number | string
  taskType?: number | string
  timeUnits?: number
  timeRequired?: number
  objectSets?: number[]
  linkedWorkflow?: LinkedWorkflowType
  ponderation?: PonderationType
}

type PonderationType = {
  theory: string
  practice: string
  individual: string
  generalEdu: string
  specificEdu: string
}

export type LinkedWorkflowType = {
  id: number
  title: string
  ponderation?: PonderationType
}
