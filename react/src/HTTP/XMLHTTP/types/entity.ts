import { ObjectPermission, PermissionGroup } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { WorkspaceType } from '@cf/types/enum'
import { ObjectSetOptions } from '@cfComponents/dialog/Project/components/ObjectSets/type'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
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
  name: string
  email?: string
  language?: string
}

/*******************************************************E
 * LIBRARY
 *******************************************************/
export type ELibraryObject = {
  id: number
  author: EUser
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
  workflowCount: number
  isLinked: boolean
  isVisible: boolean
  isTemplate: boolean
}
/*******************************************************
 * PROJECT
 *******************************************************/
export type EProject = {
  author: EUser
  createdOn: Date
  deleted: boolean
  deletedOn: Date
  description: string
  disciplines: number[]
  favourite: boolean
  id: number
  lastModified: string
  // objectPermission: ObjectPermission
  userPermissions: number
  objectSets: EObjectSet[]
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
  author: EUser
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
  timeRequired: number | null
  timeSpecificHours: number
  timeUnits: number

  tableType: number
  url: string
  editCount?: number
  defaultCustomColumn: number
  defaultColumns: number[]
  weeks: number[]
  columns: number[]
  outcomes: number[]
}

/*******************************************************
 * WORKFLOW OBJECTS
 *******************************************************/
export type EWeek = {
  id: number
  deleted: boolean
  deletedOn: EDate
  isStrategy: boolean
  title: string | null
  description: string | null
  default: boolean
  weekType: number // @todo try to check this
  weekTypeDisplay: string
  strategyClassification: number
  order: number
  comments: number[]
  nodes: number[]
}

export type EColumn = {
  id: number
  deleted: boolean
  deletedOn: EDate
  title: null

  colour: null
  columnType: number
  columnTypeDisplay: string
  icon: string | null
  visible: boolean
  comments: number[]
  order: number
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
  linkedWorkflow: number
  linkedWorkflowData: any
  hasAssignment: boolean
  isDropped?: boolean
  order: number
  week: number
  sets: any[] // ..???
  outcomenodeSet: number[]
  outcomenodeUniqueSet: number[]
  comments: number[]
}

export type EObjectSet = {
  id: number
  title: string
  term: ObjectSetOptions
  translationPlural: null | string
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

  depth: number
  type: string
  outcomeworkflow: number
  isDropped: boolean
  comments: number[]
  sets: number[]
  childOutcomeLinks: number[]
  outcomeHorizontalLinks: number[]
  outcomeHorizontalLinksUnique: number[]
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
export type ENotification = {
  id: number
  type: WorkspaceType
  unread: boolean
  from: string
  text: string
  date: EDate
}

export type EStrategy = any
export type EParentWorkflow = any
export type EChildWorkflow = any
export type EWorkspaceUser = EUser & {
  group: PermissionGroup
}
