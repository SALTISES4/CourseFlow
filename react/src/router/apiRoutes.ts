import { addPrefixToLeafStrings } from '@cf/utility/utilityFunctions'

const apiPathBase = '/course-flow/json-api/v1/'
const domainPath = '/course-flow/'
export const apiPathRoutes = {
  json_api: {
    workspace: {
      delete_self_soft: 'workflow/delete-self-soft',
      delete_self: 'workflow/delete-self',
      restore_self: 'workflow/restore-self',
      duplicate_self: 'workflow/duplicate-self'
    },
    library: {
      home: '/library/home',
      explore: '/library/explore',
      library__objects_search: '/library/objects-search',
      library__favourites__projects: '/library/favourites',
      library__library__projects: '/library/library/projects',
      library__toggle_favourite__post: '/library/toggle-favourite'
    },
    project: {
      create: '/project/create',
      detail: '/project/:id/detail',
      duplicate: '/project/:id/duplicate',
      object_set__create: 'project/:id/object-set/create',
      list__by_current_user: 'projects/my-projects',
      workflows__list: 'project/:id/list-workflows'
    },
    workflow: {
      detail: '/workflow/:id/detail',
      detail__full: '/workflow/:id/detail-full',
      parent: '/workflow/:id/parent',
      parent__detail: '/workflow/:id/parent-detail',
      child: '/workflow/:id/child',
      list__possible_added: '/workflow/list--added',
      list__possible_linked: '/workflow/list--linked',
      duplicate: 'workflow/:id/duplicate-to-project',
      strategy__duplicate: 'workflow/:id/strategy/duplicate',
      strategy__toggle: 'workflow/:id/strategy/toggle',
      strategy__create: 'workflow/:id/strategy/create',
      link: 'workflow/link'
    },
    node: {
      create: '/node/create',
      link__create: '/node-link/create'
    },
    user: {
      list: '/user/list',
      profile_settings: '/user/profile-settings',
      profile_settings__update: '/user/profile-settings/update',
      notification_settings: '/user/notifications-settings',
      notification_settings__update: '/user/notifications-settings/update'
    },
    notification: {
      list: '/notification/list',
      delete: '/notification/delete',
      mark_all_as_read: '/notification/mark-all-as-read',
      select: '/notification/select'
    },
    comment: {
      list_by_object: '/comment/list',
      create: '/comment/create',
      delete: '/comment/delete',
      delete_all: '/comment/delete-all'
    },
    exportImport: {
      import: '/import',
      export: '/export'
    }
  }
}

const apiPathsReplaced = addPrefixToLeafStrings<typeof apiPathRoutes>(
  apiPathRoutes,
  apiPathBase
)

export const apiPaths = {
  ...apiPathsReplaced,
  external: {
    resetPasswordUrl: '/login/',
    logout: '/logout/',
    daliteUrl: '/',
    static_assets: {
      icon: '/static/course_flow/img/images_svg/'
    }
  }
}
