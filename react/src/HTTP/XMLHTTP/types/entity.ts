import { ObjectPermission, PermissionGroup } from '@cf/types/common'
import { CfObjectType, LibraryObjectType } from '@cf/types/enum'
import { WorkspaceType } from '@cf/types/enum'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { NodeTypeDisplay } from '@cfRedux/types/type'

/*******************************************************
 * 'E' prefix symbolizes 'Entity', this is because these are essentially dumps from the
 * python/django datamodels.
 * the abstraction leaks are problematic
 *******************************************************/

/*******************************************************
 * PRIMITIVES
 *******************************************************/
export type EDate = string

/*******************************************************
 * ABSTRACT
 *******************************************************/
interface CourseFlowEntity {
  id: number
  hash: string
  deleted: boolean
  deletedOn: EDate
  createdOn: EDate
  lastModified: EDate
  title: string
  description: string
}

export type EUser = {
  id: number
  username: string
  firstName: string
  lastName: string
  name: string
  email?: string
  language?: string
}

// @todo what is this for?
export interface ENewItem extends CourseFlowEntity {
  type: string
  favourite: boolean
  isOwned: boolean
  isStrategy: boolean
  published: boolean
  author: string
  projectTitle: null
  objectPermission: ObjectPermission
  hasLiveproEject: boolean
  workflowCount: number
  isLinked: boolean
  isVisible: boolean
}

/*******************************************************E
 * LIBRARY
 *******************************************************/
export interface ELibraryObject extends CourseFlowEntity {
  author: EUser
  favourite: boolean
  published: boolean
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
export interface EProject extends CourseFlowEntity {
  author: EUser
  userPermissions: number
  favourite: boolean
  // objectPermission: ObjectPermission
  disciplines: number[]
  tags: ETag[]
  published: boolean
  type: CfObjectType.PROJECT
  workflowprojectSet: number[]
}

/*******************************************************
 * WORKFLOW
 *******************************************************/
export interface EWorkflow extends CourseFlowEntity {
  author: EUser
  userPermissions: number
  favourite: boolean
  published: boolean
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
export interface EWeek extends CourseFlowEntity {
  isStrategy: boolean
  default: boolean
  weekType: number // @todo try to check this
  weekTypeDisplay: string
  strategyClassification: number
  order: number
  comments: number[]
  nodes: number[]
}

export interface EColumn extends CourseFlowEntity {
  colour: string | null
  columnType: number
  columnTypeDisplay: string
  icon: string | null
  visible: boolean
  comments: number[]
  order: number
}

export interface ENode extends CourseFlowEntity {
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
  linkedWorkflowData: any // TODO:
  hasAssignment: boolean
  order: number
  week: number
  tags: number[]
  outcomenodeSet: number[]
  outcomenodeUniqueSet: number[]
  comments: number[]
}

export type ETag = {
  id: number
  title: string
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
  comments: number[]
  sets: number[]
  childOutcomeLinks: number[]
  outcomeHorizontalLinks: number[]
  outcomeHorizontalLinksUnique: number[]
}

/*******************************************************
 * WORKFLOW RELATIONS
 *******************************************************/
export type EWeekworkflow = {
  id: number
  workflow: number
  week: number
  rank: number
  objectType: number
}
export type EColumnworkflow = EOutcomeWorkflow

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
