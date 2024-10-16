import { ObjectSetOptions } from '@cfComponents/dialog/Project/components/ObjectSets/type'
import {EUser} from "@XMLHTTP/types/entity";
import { MouseEvent } from 'react'

export type ToDefine = any

export type ObjectPermission = {
  permissionType: number
  role_type: number
  lastViewed?: Date
}

export type QueryPages = {
  total_results: number
  page_count: number
  current_page: number
  results_per_page: number
}

export type Discipline = {
  id: number
  title: string
}

export type ObjectLock = {
  userId: number
  userColour: string
}

export type NumTuple = [number, number]

export type FieldChoice = {
  type: number | string
  name: string
}

export type Lock = {
  userColour: string
  userId: string
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
  | MouseEvent<HTMLDivElement>
  | JQuery.Event
  | MouseEvent<Element>

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
  id: number
  name: string
  email: string
  permissionGroup: PermissionGroup
}

export type ObjectSetType = {
  title: string
  term: string
}

/*******************************************************
 * simplified project for UI
 *******************************************************/
export type ProjectDetailsType = {
  id: number
  title: string
  description: string
  isFavorite: boolean
  isDeleted: boolean
  created: Date | string
  author: EUser
  disciplines?: string[]
  permissionGroup: PermissionGroup
  objectSets?: ObjectSetType[]
}
