import Utility from '@cf/utility/Utility.class'

const apiPathBase = '/api'

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
    // workspace: {
    //   duplicate: '/workspace/:id/duplicate',
    //   delete_soft: '/workspace/:id/delete-soft',
    //   delete: '/workspace/:id/delete',
    //   restore: '/workspace/:id/restore',
    //   field__update: '/workspace/:id/update-field'
    // },
    workspaceUser: {
      list: '/workspace-user/:id/list',
      list_available: '/workspace-user/:id/list-available',
      create: '/workspace-user/:id/create',
      delete: '/workspace-user/:id/delete',
      update: '/workspace-user/:id/update'
    },
    project: {
      // create: '/project/create',
      // detail: '/project/:id/detail',
      // update: '/project/:id/update',
      duplicate: '/project/:id/duplicate',
      object_set__create: '/project/:id/object-set/create',
      list__by_current_user: '/project/my-projects',
      workflows__list: '/project/:id/workflow'
    },
    workflow: {
      // detail: '/workflow/:id/detail',
      // parent__detail: '/workflow/:id/parent/detail',
      // parent__detail__full: '/workflow/:id/parent/detail-full',
      // child__detail: '/workflow/:id/child/detail',
      // list__possible_linked: '/workflow/linked',
      list__possible_added: '/workflow/added',
      list_templates: '/workflow/template/list',
      public__detail: '/workflow/:id/public/detail',
      public__parent__detail: '/workflow/:id/public/parent/detail',
      public__parent__detail_full: '/workflow/:id/public/parent/detail-full',
      public__child__detail: '/workflow/:id/public/child/detail',
      // editing
      // create: '/workflow/create',
      duplicate: '/workflow/:id/duplicate-to-project',
      // update: '/workflow/:id/update',
      //      link: '/workflow/:id/link-to-node',
      strategy__toggle: '/workflow/:id/strategy/toggle',
      strategy__duplicate: '/workflow/:id/strategy/duplicate',
      strategy__add_to_workflow: '/workflow/:id/strategy/add-to-workflow',
      // child objects
      object__duplicate: '/workflow/object/duplicate',
      object__insert_sibling: '/workflow/object/insert-sibling',
      object__insert_child: '/workflow/object/insert-sibling',
      object__order: '/workflow/object/order'
    },
    node: {
      // create: '/node/create',
      // delete: '/node/:id/delete',
      // delete_soft: '/node/:id/delete_soft',
      // restore: '/node/:id/restore',
      // duplicate: '/node/:id/duplicate',
      // update_position: '/node/:id/update-position',
      // toggle_object_set: '/node/:id/toggle-object-set',
      link__create: '/node/node-link/create',
      link_to_workflow: '/node/:id/link-to-workflow'
    },
    week: {
      create: '/week/create',
      duplicate: '/week/:id/duplicate',
      update_position: '/week/:id/update-position',
      delete: '/week/:id/delete'
    },
    column: {
      create: '/column/create',
      update_position: '/column/:id/update-position',
      delete: '/column/:id/delete'
    },
    comment: {
      list_by_object: '/comment/list-by-object',
      create: '/comment/create',
      delete: '/comment/:id/delete',
      delete_all: '/comment/delete-all'
    },
    exportImport: {
      import: '/import',
      export: '/export'
    }
  },
  /**
   * CourseFlow v2 (Django Ninja) — mounted at `path("api/", api.urls)` in course_flow_v2/urls.py.
   * Leaf paths are relative to `/api` (same prefix as `json_api` via `apiPathBase`).
   * Use `generatePath()` for segments like `:workflowUuid`.
   */
  json_api_v2: {
    meta: {
      health: '/health',
      docs: '/docs',
      openapi_json: '/openapi.json'
    },
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      me: '/auth/me'
    },
    user: {
      collection: '/user',
      me_profile_settings: '/user/me/profile-settings',
      me_notification_settings: '/user/me/notification-settings',
      me_notifications: '/user/me/notifications',
      me_notifications_mark_all_as_read:
        '/user/me/notifications/mark-all-as-read',
      me_notification_mark_as_read: '/user/me/notifications/:uuid/mark-as-read',
      me_notification_detail: '/user/me/notifications/:uuid'
    },
    project: {
      collection: '/project',
      detail: '/project/:uuid',
      graph: '/project/:uuid/graph'
    },
    workflow: {
      collection: '/workflow',
      detail: '/workflow/:uuid',
      graph: '/workflow/:uuid/graph',
      nodes: '/workflow/:uuid/nodes',
      edges: '/workflow/:uuid/edges',
      related_parents: '/workflow/:uuid/related/parents',
      related_children: '/workflow/:uuid/related/children'
    },
    node: {
      collection: '/node',
      detail: '/node/:uuid'
    },
    edge: {
      collection: '/edge',
      detail: '/edge/:uuid'
    },
    thread: {
      collection: '/thread',
      comments: '/thread/:uuid/comments'
    },
    library: {
      search: '/library/search'
    }
  }
}

const apiPathsReplaced = Utility.addPrefixToLeafStrings<typeof apiPathRoutes>(
  apiPathRoutes,
  apiPathBase
)

export const apiPaths = {
  ...apiPathsReplaced,
  external: {
    resetPasswordUrl: '/login/',
    logout: '/logout/',
    static_assets: {
      icon: '/static/course_flow/img/images_svg/'
    }
  }
}
