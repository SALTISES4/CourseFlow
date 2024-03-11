import { WorkflowType } from '@cfModule/types/enum'
import { MouseEvent } from 'react'

export type ToDefine = any

// @todo what is the difference between this type and the redux one
export interface Workflow {
  id: number
  author: string
  created_on: string
  deleted: boolean
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
  workflow_count: null | number
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

export type ObjectSet = {
  id: number | string
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

export type SidebarProps = {
  isAnonymous: boolean
  isTeacher: boolean
  favourites: {
    title: string
    url: string
  }[]
}

export type TopBarProps = {
  isTeacher: boolean
  notifications: {
    url: string
    unread: number
    items: {
      unread: boolean
      url: string
      from: string
      text: string
      date: string
    }[]
  }
  forms: {
    createProject: {
      showNoProjectsAlert: boolean
      disciplines: Discipline[]
      formFields: FormFieldSerialized[]
    }
  }
  menus: {
    add: {
      projectUrl: string
    }
    account: {
      notificationsSettingsUrls: string
      profileUrl: string
      resetPasswordUrl: string
      daliteUrl: string
      daliteText: string
    }
  }
}

export type FormFieldSerialized = {
  name: string
  label?: string
  type: string
  required?: boolean
  options?: string
  max_length?: number
  help_text?: string
  value?: string
}

export type EventUnion =
  | MouseEvent<HTMLDivElement>
  | JQuery.Event
  | MouseEvent<Element>
