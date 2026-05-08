import { ObjectPermission, PermissionGroup } from '@cf/types/common'
import { CfObjectType, LibraryObjectType } from '@cf/types/enum'
import { WorkspaceType } from '@cf/types/enum'
import { NodeTypeDisplay } from '@cfRedux/types/type'

import { WorkflowType } from '../../../components/pages/Workflow/types'

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
  uuid: string
  hash: string
  deleted: boolean
  deletedOn: EDate
  createdOn: EDate
  lastModified: EDate
  title: string
  description: string
}

export type EUser = {
  uuid: string
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
  sections: number[]
  columns: number[]
  outcomes: number[]
}

/*******************************************************
 * WORKFLOW OBJECTS
 *******************************************************/
export interface ESection extends CourseFlowEntity {
  isStrategy: boolean
  default: boolean
  sectionType: number // @todo try to check this
  sectionTypeDisplay: string
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
  outgoingLinks: number[]
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
  linkedWorkflow: number | null
  linkedWorkflowData: ELibraryObject | null
  hasAssignment: boolean
  order: number
  section: number
  tags: number[]
  outcomenodeSet: number[]
  outcomenodeUniqueSet: number[]
  comments: number[]
}

export type ETag = {
  uuid: string
  title: string
}

export type EDiscipline = {
  uuid: string
  title: string
}

export type EComment = {
  uuid: string
  user: EUser
  createdOn: EDate
  text: string
}

export type ENodelink = {
  deleted: boolean
  deletedOn: EDate
  uuid: string
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
  uuid: string
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
export type ESectionworkflow = {
  uuid: string
  workflow: number
  section: number
  rank: number
  objectType: number
}
export type EColumnworkflow = EOutcomeWorkflow

export type EOutcomeWorkflow = {
  uuid: string
  rank: number
  workflow: number
  outcome: number
}

export type EOutcomeHorizontalLink = {
  outcome: number
  parentOutcome: number
  rank: number
  uuid: string
  degree: number
}

export type EOutcomeOutcome = {
  parent: number
  child: number
  rank: number
  uuid: string
}

export type ENodesection = {
  addedOn: EDate
  section: number
  node: number
  rank: number
  uuid: string
}

export type EOutcomenode = {
  node: number
  outcome: number
  rank: number
  uuid: string
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
  uuid: string
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
