import { LibraryContentTypeOut } from '@cf/api/gen'
import { ObjectPermission } from '@cf/types/common'

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
  published: boolean
  type: LibraryContentTypeOut
  projectTitle: string
  objectPermission: ObjectPermission
  workflowCount: number
  isFavorite: boolean
  isStrategy: boolean
  isOwned: boolean
  isLinked: boolean
  isVisible: boolean
  isTemplate: boolean
}
