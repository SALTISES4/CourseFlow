import { ObjectPermission, ObjectSet } from '@cf/types/common'
import { LibraryObjectType, WorkflowType } from '@cf/types/enum'
import { NodeTypeDisplay } from '@cfRedux/types/type'

/*******************************************************
 * 'E' prefix symbolizes 'Entity', this is because these are essentially dumps from the
 * python/django datamodels.
 * the abstraction leaks are problematic
 *******************************************************/
export type EDate = string

export type EUser = {
  id: number
  username: string
  firstName: string
  lastName: string
  userColour?: string
}

/*******************************************************
 * LIBRARY
 *******************************************************/
export type ELibraryObject = {
  id: number
  author: string
  deleted: boolean
  createdOn: EDate
  lastModified: EDate
  title: string
  favourite: boolean
  published: boolean
  description: string

  type: LibraryObjectType
  isOwned: boolean
  isStrategy: boolean
  projectTitle: string
  objectPermission: ObjectPermission
  hasLiveproject: boolean
  workflowCount: number
  isLinked: boolean
  isVisible: boolean
  isTemplate: boolean
}
/*******************************************************
 * PROJECT
 *******************************************************/
export type EProject = {
  author: string
  authorId: number
  createdOn: Date
  deleted: boolean
  deletedOn: Date
  description: string
  disciplines: number[]
  favourite: boolean
  id: number
  lastModified: string
  objectPermission: ObjectPermission
  userPermissions: number
  objectSets: ObjectSet[]
  published: boolean
  title: string
  // TODO: identify these really are the types / convert to enum?
  type: 'project'
  workflowprojectSet: number[]
}

/*******************************************************
 * WORKFLOW
 *******************************************************/
export type EWorkflow = {
  id: number
  userPermissions: number
  author: string
  authorId: number | null
  deleted: boolean
  createdOn: Date
  lastModified: Date
  deletedOn: EDate
  title: string
  favourite: boolean
  published: boolean
  description: null | string
  isOriginal: boolean
  isStrategy: boolean
  isTemplate: boolean
  type: WorkflowType
  publicView: boolean
  condensed: boolean
  importing: boolean

  code: null

  outcomesSort: number
  outcomesType: number
  parentWorkflow: null | number
  ponderationIndividual: number
  ponderationPractical: number
  ponderationTheory: number

  timeGeneralHours: number
  timeRequired: null
  timeSpecificHours: number
  timeUnits: number

  weekworkflowSet: number[]
  columnworkflowSet: number[]
  outcomeworkflowSet: any[]

  url: string
  editCount?: number
  defaultColumns: number[]
  defaultCustomColumn: number
}

/*******************************************************
 * WORKFLOW OBJECTS
 *******************************************************/
export type EWeek = {
  id: number
  deleted: boolean
  deletedOn: EDate
  title: null
  description: null

  default: boolean
  nodeweekSet: number[]
  objectType: number
  weekTypeDisplay: string
  isStrategy: boolean
  strategyClassification: number
  comments: any[]
}

export type EColumn = {
  id: number
  deleted: boolean
  deletedOn: EDate
  title: null

  colour: null
  columnType: number
  columnTypeDisplay: string
  comments: any[]
  icon: string | null
  visible: boolean
}

export type ENode = {
  deleted: boolean
  deletedOn: EDate
  id: number
  title: null
  description: null
  column: number
  columnworkflow: number
  contextClassification: number
  taskClassification: number
  outcomenodeSet: any[]
  outcomenodeUniqueSet: any[]
  outgoingLinks: any[]
  nodeType: number
  nodeTypeDisplay: NodeTypeDisplay
  hasAutolink: boolean
  timeUnits: number
  timeRequired: any | null
  ponderationTheory: number
  ponderationPractical: number
  ponderationIndividual: number
  timeGeneralHours: number
  timeSpecificHours: number
  representsWorkflow: boolean
  linkedWorkflow: any
  linkedWorkflowData: any
  comments: any[]
  sets: any[]
  hasAssignment: boolean
  isDropped?: boolean
}

export type EObjectSet = {
  title: string
  id: number
  translationPlural: string
  term: string
}

export type EDiscipline = {
  id: number
  title: string
}

export type EComment = {
  id: number
  user: EUser
  createdOn: EDate
  text: string
}

/*******************************************************
 * WORKFLOW RELATIONS
 *******************************************************/
export type EWeekworkflow = {
  workflow: number
  week: number
  rank: number
  id: number
  objectType: number
}
export type EColumnworkflow = EOutcomeWorkflow

export type ENodelink = {
  deleted: boolean
  deletedOn: EDate
  id: number
  title: string | null
  sourceNode: number
  targetNode: number
  sourcePort: number
  targetPort: number
  dashed: boolean
  textPosition: number
}

/*******************************************************
 * OUTCOME
 *******************************************************/
export type EOutcome = {
  id: number
  deleted: boolean
  deletedOn: EDate
  title: string
  description: string

  code: string
  childOutcomeLinks: number[]
  outcomeHorizontalLinks: number[]
  outcomeHorizontalLinksUnique: number[]
  depth: number
  type: string
  comments: any[]
  sets: number[]
  outcomeworkflow: number
  isDropped: boolean
}
export type EOutcomeWorkflow = {
  id: number
  rank: number
  workflow: number
  outcome: number
}

export type EOutcomeHorizontalLink = {
  outcome: number
  parentOutcome: number
  rank: number
  id: number
  degree: number
}

export type EOutcomeOutcome = {
  parent: number
  child: number
  rank: number
  id: number
}

export type ENodeweek = {
  addedOn: EDate
  week: number
  node: number
  rank: number
  id: number
}

export type EOutcomenode = {
  node: number
  outcome: number
  rank: number
  id: number
  degree: number
}

export type ENewItem = {
  deleted: boolean
  id: number
  createdOn: EDate
  lastModified: string
  type: string
  favourite: boolean
  isOwned: boolean
  isStrategy: boolean
  published: boolean
  author: string
  title: string
  description: string
  projectTitle: null
  objectPermission: ObjectPermission
  hasLiveproject: boolean
  workflowCount: number
  isLinked: boolean
  isVisible: boolean
}

export type ESectionGroup = {
  title: string
  sections: ESection[]
  add: boolean
  duplicate: string
  emptytext: string
}

export type ESection = {
  title: string
  objectType: string
  isStrategy: boolean
  objects: ELibraryObject[]
}

export type EStrategy = any
export type EParentWorkflow = any
export type EChildWorkflow = any
