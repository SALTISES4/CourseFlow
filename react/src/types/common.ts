import { MouseEvent } from 'react'

export type ToDefine = any

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

// TODO: Consolidate with the types in CreateProject/type
export type ObjectSet = {
  id: number
  title: string
  term: string
  translation_plural: null | string
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
      formFields: FormFieldSerialized[]
    }
  }
}

export type FormFieldSerialized = {
  name: string
  label?: string
  type: string
  required?: boolean
  options?: { value: string; label: string }[]
  max_length?: number
  help_text?: string
  value?: string
}

export type EventUnion =
  | MouseEvent<HTMLDivElement>
  | JQuery.Event
  | MouseEvent<Element>

/*******************************************************
 *
 *******************************************************/
export enum PROJECT_PERMISSION_ROLE {
  'OWNER' = 'owner',
  'EDITOR' = 'editor',
  'COMMENTER' = 'commenter',
  'VIEWER' = 'viewer'
}

export type PermissionUserType = {
  id: number
  name: string
  email: string
  role: PROJECT_PERMISSION_ROLE
}

export type ObjectSetType = {
  title: string
  type: string
}

export type ProjectDetailsType = {
  id: number
  title: string
  description: string
  isFavorite?: boolean
  disciplines?: string[]
  created: Date | string
  permissions?: PermissionUserType[]
  objectSets?: ObjectSetType[]
}
