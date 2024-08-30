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
  options?: { value: string; label: string }[]
  max_length?: number
  help_text?: string
  value?: string
}

export type EventUnion =
  | MouseEvent<HTMLDivElement>
  | JQuery.Event
  | MouseEvent<Element>
