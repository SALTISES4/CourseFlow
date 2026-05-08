import * as d3 from 'd3'

import {
  Discipline,
  FieldChoice,
  FormFieldSerialized,
  SidebarProps,
  TopBarProps
} from './common'
export {}
declare global {
  /** Legacy Django-era global; populated at runtime from `bootstrap.ts` (mock JSON in dev). */
  var COURSEFLOW_APP: CourseflowAppGlobals
}

export interface CourseflowAppGlobals {
  // global context data that's available that more general use
  // (sidebar, topbar, app notifications, etc)
  globalContextData: GlobalContextData
}

interface Path {
  post_paths: { [key: string]: string }
  get_paths: GetPaths
  update_path: UpdatePath
  /* SORTED */
  html: HTMLPaths
  //   json_api: JSONAPIPaths
  static_assets: GenericPath
}

interface GetPaths {
  get_public_parentWorkflow_info: string
}

interface HTMLPaths {
  update_path_temp: string
  public_update_path_temp: string
  library: {
    home: string
    explore: string
    library: string
    favourites: string
  }
}

interface GenericPath {
  [key: string]: string
}

interface UpdatePath {
  project: string
  activity: string
  course: string
  program: string
  workflow: string
}

export interface GlobalContextData {
  disciplines: Discipline[]
  workflowChoices: {
    taskChoices: FieldChoice[]
    timeChoices: FieldChoice[]
    contextChoices: FieldChoice[]
    strategyClassificationChoices: FieldChoice[]
    outcomeTypeChoices: FieldChoice[]
    outcomeSortChoices: FieldChoice[]
    columnChoices: FieldChoice[]
  }
  path: Path
  appNotifications: {
    showNotificationRequest: boolean
    updateNotifications:
      | {
          title: string
          uuid: string
        }
      | Record<string, never>
  }
}

interface Identifier {
  _reactListeningarkdylqyv1: boolean
}

export type NodeDom = {
  nodeOffset: {
    top: number
    left: number
  }
  nodeDimensions: {
    height: number
    width: number
  }
}
