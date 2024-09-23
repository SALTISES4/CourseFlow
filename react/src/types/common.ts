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

// TODO: Consolidate with the types in CreateProject/type
export type ObjectSet = {
  id: number
  title: string
  term: string
  translationPlural: null | string
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

export type SidebarProps = {
  isAnonymous: boolean
  favourites: {
    title: string
    url: string
  }[]
}

export type TopBarProps = {
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
export enum projectPermission_ROLE {
  'OWNER' = 'owner',
  'EDITOR' = 'editor',
  'COMMENTER' = 'commenter',
  'VIEWER' = 'viewer'
}

export type PermissionUserType = {
  id: number
  name: string
  email: string
  role: projectPermission_ROLE
}

export type ObjectSetType = {
  title: string
  type: string
}

/*******************************************************
 * simplified project for UI
 *******************************************************/
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
