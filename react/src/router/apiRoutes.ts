import { addPrefixToLeafStrings } from '@cf/utility/utilityFunctions'

const apiPathBase = '/course-flow/json-api/v1'
export const apiPathRoutes = {
  json_api: {
    user: {
      current_user: '/user/current-user',
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
    library: {
      home: '/library/home',
      library__objects_search: '/library/objects-search',
      library__favourites__projects: '/library/favourites',
      library__toggle_favourite__post: '/library/toggle-favourite'
    },
    project: {
      create: '/project/create',
      detail: '/project/:id/detail',
      update: '/project/:id/update',
      duplicate: '/project/:id/duplicate',
      object_set__create: '/project/:id/object-set/create',
      list__by_current_user: '/project/my-projects',
      workflows__list: '/project/:id/workflow'
    },
    workflow: {
      detail: '/workflow/:id/detail',
      parent__detail: '/workflow/:id/parent/detail',
      parent__detail__full: '/workflow/:id/parent/detail-full',
      child__detail: '/workflow/:id/child/detail',
      list__possible_linked: '/workflow/linked',
      list__possible_added: '/workflow/added',
      list_templates: '/workflow/template/list',
      public__detail: '/workflow/:id/public/detail',
      public__parent__detail: '/workflow/:id/public/parent/detail',
      public__parent__detail_full: '/workflow/:id/public/parent/detail-full',
      public__child__detail: '/workflow/:id/public/child/detail',
      // editing
      create: '/workflow/create',
      duplicate: '/workflow/:id/duplicate-to-project',
      update: '/workflow/:id/update',
      link: '/workflow/:id/link-to-node',
      strategy__toggle: '/workflow/:id/strategy/toggle',
      strategy__duplicate: '/workflow/:id/strategy/duplicate',
      strategy__add_to_workflow: '/workflow/:id/strategy/add-to-workflow',
      // child objects
      object__duplicate: '/workflow/object/duplicate',
      object__insert_sibling: '/workflow/object/insert-sibling',
      object__insert_child: '/workflow/object/insert-sibling'
    },
    workspace: {
      duplicate: '/workspace/:id/duplicate',
      delete_soft: '/workspace/:id/delete-soft',
      delete: '/workspace/:id/delete',
      restore: '/workspace/:id/restore',
      field__update: '/workspace/:id/update-field'
    },
    workspaceUser: {
      list: '/workspace-user/:id/list',
      list_available: '/workspace-user/:id/list-available',
      create: '/workspace-user/:id/create',
      delete: '/workspace-user/:id/delete',
      update: '/workspace-user/:id/update'
    },
    node: {
      create: '/node/create',
      link__create: '/node-link/create'
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
