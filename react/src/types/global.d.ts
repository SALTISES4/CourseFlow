import * as d3 from 'd3'
import jQuery from 'jQuery'
export {}
declare global {
  /*~ Here, declare things that go in the global namespace, or augment
   *~ existing declarations in the global namespace
   */
  interface Window {
    ngettext: (str: string, str2: string, count: number) => string
    gettext: (str: string) => string
    fail_function: (action?: string) => void
    getCsrfToken: () => string
    cf_nonce: string
  }
  interface Document {
    lastUpdateCall: {
      time: number
      id: number
      type: string
      field: string
    }
    lastUpdateCallFunction
    lastUpdateCallTimer
  }

  const $: jQuery
  const d3: d3
  const globalD3: d3
  const COURSEFLOW_APP: CourseflowAppGlobals
  const makeActiveSidebar: (id: string) => void // @todo
}

interface CourseflowAppGlobals {
  config: Config
  strings: Strings
  path_id: string
  globalContextData: GlobalContextData
  contextData: ContextData
  tinyLoader: TinyLoader
  makeDropdown: (
    item: HTMLElement | HTMLDivElement | jQuery<HTMLDivElement> | string, // @todo ...
    item2?: HTMLElement | HTMLDivElement | jQuery<HTMLDivElement> | string // @todo ...
  ) => void
}

interface Config {
  post_paths: { [key: string]: string }
  get_paths: GetPaths

  create_path: CreatePath
  update_path: UpdatePath
  public_update_path: PublicUpdatePath
  home_path: string
  explore_path: string
  my_library_path: string
  my_favourites_path: string
  my_liveprojects_path: string
  registration_path: string
  logout_path: string
  icon_path: string
  json_api_paths: JSONAPIPaths
}

interface CreatePath {
  activity_strategy: string
  course_strategy: string
  project: string
  activity: string
  course: string
  program: string
}

interface GetPaths {
  get_disciplines: string
  get_library: string
  get_favourites: string
  import: string
  get_public_workflow_data: string
  get_public_workflow_parent_data: string
  get_public_workflow_child_data: string
  get_public_parent_workflow_info: string
}

interface JSONAPIPaths {
  get_top_bar: string
  get_sidebar: string
  update_profile: string
  get_notifications_page: string
  update_notifications_settings: string
  mark_all_notifications_as_read: string
  delete_notification: string
}

interface PublicUpdatePath {
  activity: string
  course: string
  program: string
  workflow: string
}

interface UpdatePath {
  project: string
  activity: string
  course: string
  program: string
  workflow: string
  liveproject: string
  liveassignment: string
}

interface GlobalContextData {
  notifications: {
    showNotificationRequest: boolean
    updateNotifications:
      | {
          title: string
          id: number
        }
      | Record<string, never>
  }
}

interface ContextData {}

interface Strings {
  confirm_email_updates: string
  unsupported_device: string
  product_updates_agree: string
  notifications: string
  home: string
  my_library: string
  explore: string
  my_classrooms: string
  favourites: string
  see_all: string
  view_all: string
  help_support: string
  password_reset: string
  password_reset_msg: string
  notification_settings: string
  sign_out: string
  profile: string
  project: string
  program: string
  course: string
  activity: string
  delete: string
  cancel: string
  show_notifications_menu: string
  notification_options: string
  mark_as_read: string
  mark_all_as_read: string
  no_notifications_yet: string
  profile_settings: string
  update_profile: string
  update_profile_success: string
}

interface TinyLoader {
  identifier: Identifier
  loadings: number
  startLoad: () => void
  endLoad: () => void
}

interface Identifier {
  _reactListeningarkdylqyv1: boolean
}
