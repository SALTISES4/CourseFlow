import type { PermissionContextOut } from '@cf/api/gen'
import { TTag } from '@cf/redux/types/type'
import { EUser } from '@XMLHTTP/types/entity'
import { MouseEvent as ReactMouseEvent } from 'react'

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

// TODO: verify we still need this, why not just use the project type from the API/codegen
export type ProjectDetailsType = {
  uuid: string
  title: string
  description: string
  isFavorite: boolean
  isDeleted: boolean
  isPublished: boolean
  isArchived: boolean
  permissions: PermissionContextOut
  created: Date | string
  author: EUser
  disciplines?: string[]
  tags?: TTag[]
}
