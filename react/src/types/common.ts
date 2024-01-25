import { WorkflowType } from '@cfModule/types/enum'
import * as React from 'react'

export type ToDefine = any

// @todo what is the difference between this type and the redux one
export interface Workflow {
  id: number
  author: string
  created_on: string
  deleted: boolean
  description: string | null
  favourite: boolean
  has_liveproject: boolean
  is_linked: boolean
  is_owned: boolean
  is_strategy: boolean
  is_visible: boolean
  last_modified: string
  object_permission: ObjectPermission
  project_title: null
  published: boolean
  title: string
  type: WorkflowType
  workflow_count: null
}

export type ObjectPermission = {
  permission_type: number
  last_viewed: Date
  role_type: number
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
  user_id: number
  user_colour: string
}

export type NumTuple = [number, number]

export type FieldChoice = {
  type: number | string
  name: string
}

export type Lock = {
  user_colour: string
  user_id: string
}

export type EventUnion =
  | React.MouseEvent<HTMLDivElement, MouseEvent>
  | JQuery.Event
  | React.MouseEvent<Element, MouseEvent>
