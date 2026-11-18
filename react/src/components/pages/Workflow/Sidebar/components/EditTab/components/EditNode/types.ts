import type {
  ContextClassification,
  TaskClassification
} from '@cf/api/gen/types.gen'

export type NodeForm = {
  title?: string
  description?: string
  contextType?: ContextClassification | ''
  taskType?: TaskClassification | ''
  timeRequiredMinutes?: number
  tags?: number[]
  credits?: number | string
  linkedWorkflow?: LinkedWorkflowType
  ponderation?: PonderationType
  /** Program-node-local (FR-WF-EN-006); persisted when API supports it. */
  specificEducation?: boolean
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
//   sets?: number[]
// }

type PonderationType = {
  theoryMinutes?: number
  practiceMinutes?: number
  individualMinutes?: number
}

export type LinkedWorkflowType = {
  uuid: string
  title: string
  ponderation?: PonderationType
}
