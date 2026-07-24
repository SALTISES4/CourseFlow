import { ProjectDetailOut } from '@cf/api/gen'
import type { PermissionContextOut } from '@cf/api/gen'
import { TTag } from '@cf/redux/types/type'
import { EUser } from '@XMLHTTP/types/entity'
import { MouseEvent as ReactMouseEvent } from 'react'

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

