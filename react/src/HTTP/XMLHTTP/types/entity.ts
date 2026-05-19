import { ObjectPermission } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'

/*******************************************************
 * PRIMITIVES
 *******************************************************/
export type EDate = string

/*******************************************************
 * ABSTRACT
 *******************************************************/
export interface CourseFlowEntity {
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


