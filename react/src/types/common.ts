import { TTag } from '@cf/redux/types/type'
import { EUser } from '@XMLHTTP/types/entity'
import { MouseEvent as ReactMouseEvent } from 'react'

export type ObjectPermission = {
  permissionType: number
  roleType: number
  lastViewed?: Date
}

export type Discipline = {
  uuid: string
  title: string
}

export type FieldChoice = {
  type: number | string
  name: string
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

export type ProjectDetailsType = {
  /**
   *
   *  @todo verify we still need this, why not just use the project type from the API/codegen
   *   */
  uuid: string
  title: string
  description: string
  isFavourite: boolean
  isDeleted: boolean
  created: Date | string
  author: EUser
  disciplines?: string[]
  tags?: TTag[]
}
