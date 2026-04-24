import { TTag } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { EUser } from '@XMLHTTP/types/entity'
import { MouseEvent as ReactMouseEvent } from 'react'

export type ToDefine = any

export type ObjectPermission = {
  permissionType: number
  roleType: number
  lastViewed?: Date
}

export type ObjectLock = {
  userId: string
  userColour: string
}

export type QueryPages = {
  totalResults: number
  pageCount: number
  currentPage: number
  resultsPerPage: number
}

export type Discipline = {
  id: string
  title: string
}

export type NumTuple = [number, number]

export type FieldChoice = {
  type: number | string
  name: string
}

export type CfLock = {
  userId: string
  objectId: string
  expires: number
  userColour?: string
  lock?: boolean
  objectType: CfObjectType
}

export type FormFieldSerialized = {
  name: string
  label?: string
  type: string
  required?: boolean
  options?: { value: string; label: string }[]
  maxLength?: number
  helpText?: string
  value?: string
}

export type EventUnion =
  | ReactMouseEvent<HTMLDivElement>
  | ReactMouseEvent<Element>
  | MouseEvent

/*******************************************************
 *
 *******************************************************/
// export enum PermissionGroup {
//   'OWNER' = 'owner',
//   'EDITOR' = 'editor',
//   'COMMENTER' = 'commenter',
//   'VIEWER' = 'viewer'
// }
/*
 * i don't like this but it simplifies the backend for now
 * */
export enum PermissionGroup {
  NONE,
  VIEW,
  EDIT,
  COMMENT,
  STUDENT
}

export type PermissionUserType = {
  id: string
  name: string
  email: string
  permissionGroup: PermissionGroup
}

/*******************************************************
 * simplified project for UI
 *******************************************************/
export type ProjectDetailsType = {
  /** Public project UUID from the v2 API. */
  uuid: string
  title: string
  description: string
  isFavourite: boolean
  isDeleted: boolean
  created: Date | string
  author: EUser
  disciplines?: string[]
  permissionGroup: PermissionGroup
  tags?: TTag[]
}
