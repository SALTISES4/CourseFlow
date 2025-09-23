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

// for reference
// export type NodeForm = {
//   title?: string
//   description?: string
//   amount?: number
//   linkedWorkflow?: LinkedWorkflowType
//   ponderation?: PonderationType
//   contextClassification?: number
//   taskClassification?: number
//   timeUnits?: number
//   sets?: number[]
// }
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
