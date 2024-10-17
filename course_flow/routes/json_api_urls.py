#########################################################
# Define All HTML Routes
#########################################################
from django.urls import path
from rest_framework import routers

from course_flow import views

router = routers.SimpleRouter()


def json_api_patterns():
    return [
        #########################################################
        # Register create JSON routes
        # @todo refactor these to a meaningful pattern,
        #  i.e. path: json-api/[version]/[domain]/action
        #       name: [domain]--[action]--[verb]   <-- keep verb for now until properly refactored, currently verb is not well assigned to action. i.e. we use POST and GET interchangeably to fetch, upsert and delete data
        #
        #       organize by query struct, i.e. how is the parent/child relationship defined
        #       need to decide on rule, either the parent struct defines domain, or the child struct does and then stick with it
        #       is this users by object, or object get users
        #########################################################
        #########################################################
        # PROJECT
        #########################################################
        path(
            "project/<int:pk>/detail",
            views.json_api.ProjectEndpoint.fetch_detail,
            name="project--detail",
        ),
        path(
            "project/my-projects",
            views.json_api.ProjectEndpoint.list_my_projects,
            name="project--my-projects",
        ),
        path(
            "project/create",
            views.json_api.ProjectEndpoint.create,
            name="project--create",
        ),
        path(
            "project/<int:pk>/update",
            views.json_api.ProjectEndpoint.update,
            name="project--update",
        ),
        path(
            "project/<int:pk>/duplicate",
            views.json_api.ProjectEndpoint.duplicate,
            name="project--duplicate",
        ),
        #########################################################
        # PROJECT: RELATION
        #########################################################
        path(
            "project/<int:pk>/object-set/create",
            views.json_api.ProjectEndpoint.object_set__create,
            name="json-api-post-add-object-set",
        ),
        path(
            "project/<int:pk>/workflow",
            views.json_api.ProjectEndpoint.workflows__list,
            name="project--workflows--list",
        ),
        ######## to sort ######
        path(
            "project/from-json",
            views.json_api.old_courseflow_import.json_api_post_project_from_json,
            name="json-api-post-project-from-json",
        ),
        #########################################################
        # WORKFLOW
        #########################################################
        path(
            "workflow/<int:pk>/detail",
            views.json_api.WorkflowEndpoint.fetch_detail,
            name="workflow--detail",
        ),
        # path(
        #     "workflow/<int:pk>/detail-full",
        #     views.json_api.WorkflowEndpoint.fetch_detail_full,
        #     name="workflow--detail--full",
        # ),
        path(
            "workflow/<int:pk>/parent/detail",
            views.json_api.WorkflowEndpoint.fetch_parent_detail,
            name="workflow--parent--detail",
        ),
        # @todo this is really, get workflows by node
        path(
            "workflow/<int:pk>/parent/detail-full",
            views.json_api.WorkflowEndpoint.fetch_parent_detail_full,
            name="workflow--parent--detail--full",
        ),
        # @todo this is really, get workflows by node
        path(
            "workflow/<int:pk>/child/detail",
            views.json_api.WorkflowEndpoint.fetch_child_workflow_data,
            name="json-api-post-get-workflow-child-data",
        ),
        ######################################################
        # WORKFLOW: OTHER LISTS
        #########################################################
        path(
            "workflow/linked",
            views.json_api.WorkflowEndpoint.possible_linked,
            name="json-api-post-get-possible-linked-workflows",
        ),
        path(
            "workflow/added",
            views.json_api.WorkflowEndpoint.possible_added,
            name="json-api-post-get-possible-added-workflows",
        ),
        #########################################################
        # WORKFLOW: PUBLIC
        #########################################################
        path(
            "workflow/<int:pk>/public/detail",
            views.json_api.workflow.json_api_get_public_workflow_data,
            name="json-api-get-public-workflow-data",
        ),
        path(
            "workflow/<int:pk>/public/parent/detail",
            views.json_api.workflow.json_api_get_public_workflow_parent_data,
            name="json-api-get-public-workflow-parent-data",
        ),
        # @todo this is really, get workflows by node
        path(
            "workflow/<int:pk>/public/parent/detail-full",
            views.json_api.workflow.json_api_get_public_parent_workflow_info,
            name="json-api-get-public-parent-workflow-info",
        ),
        # @todo this is really, get workflows by node
        path(
            "workflow/<int:pk>/public/child/detail",
            views.json_api.workflow.json_api_get_public_workflow_child_data,
            name="json-api-get-public-workflow-child-data",
        ),
        ######################################################
        # WORKFLOW: EDITING
        #########################################################
        path(
            "workflow/create",
            views.json_api.WorkflowEndpoint.create,
            name="workflow--create",
        ),
        path(
            "workflow/<int:pk>/update",
            views.json_api.WorkflowEndpoint.update,
            name="workflow--update",
        ),
        path(
            "workflow/<int:pk>/duplicate-to-project",
            views.json_api.WorkflowEndpoint.duplicate_to_project,
            name="workflow--duplicate-to-project",
        ),
        #########################################################
        # WORKFLOW: RELATIONS
        #########################################################
        path(
            "workflow/<int:pk>/link-to-node",
            views.json_api.WorkflowEndpoint.link_to_node,
            name="json-api-post-set-linked-workflow",
        ),
        path(
            "workflow/<int:pk>/strategy/toggle",
            views.json_api.strategy.json_api_post_week_toggle_strategy,
            name="json-api-post-toggle-strategy",
        ),
        path(
            "workflow/<int:pk>/strategy/duplicate",
            views.json_api.strategy.duplicate__strategy,
            name="json-api-post-duplicate-strategy",
        ),
        path(
            "workflow/<int:pk>/strategy/add-to-workflow",
            views.json_api.strategy.json_api_post_add_strategy,
            name="json-api-post-add-strategy",
        ),
        #########################################################
        # WORKFLOW: OBJECTS
        # children of a workflow
        # weeks
        # nodes
        # column
        # etc...
        #########################################################
        # @todo convert this to <int:pk> path fot the parent workflow as convention
        path(
            "workflow/object/insert-sibling",
            views.json_api.WorkflowObjectEndpoint.insert_sibling,
            name="workflow--object--insert-sibling",
        ),
        path(
            "workflow/object/duplicate",
            views.json_api.WorkflowObjectEndpoint.duplicate,
            name="workflow--object--duplicate",
        ),
        #### SORT #####
        # @todo so is this just for outomces>
        path(
            "workflow/outcome/insert-child",
            views.json_api.outcome.json_api_post_insert_child_outcome,
            name="json-api-post-insert-child",
        ),
        path(
            "workflow/outcome/create",
            views.json_api.outcome.json_api_post_new_outcome_for_workflow,
            name="json-api-post-new-outcome-for-workflow",
        ),
        path(
            "workflow/update-outcomenode-degree",
            views.json_api.outcome.json_api_post_update_outcomenode_degree,
            name="json-api-post-update-outcomenode-degree",
        ),
        path(
            "workflow/updateobjectset",
            views.json_api.workflow_objects.json_api_post_update_object_set,
            name="json-api-post-update-object-set",
        ),
        path(
            "workflow/inserted-at",
            views.json_api.workflow_objects.json_api_post_inserted_at,
            name="json-api-post-inserted-at",
        ),
        ##########################################################
        # WORKSPACE
        #########################################################
        path(
            "workspace/<int:pk>/delete-soft",
            views.json_api.WorkspaceEndpoint.delete_soft,
            name="json-api-post-delete-self-soft",
        ),
        path(
            "workspace/<int:pk>/restore",
            views.json_api.WorkspaceEndpoint.restore,
            name="json-api-post-restore-self",
        ),
        path(
            "workspace/<int:pk>/delete",
            views.json_api.WorkspaceEndpoint.delete,
            name="json-api-post-delete-self",
        ),
        path(
            "workspace/<int:pk>/update-field",
            views.json_api.WorkspaceEndpoint.update_value,
            name="json-api-post-update-value",
        ),
        #########################################################
        # WORKSPACE USER
        # i.e. the users who get added to a project or workflow
        #########################################################
        path(
            "workspace-user/<int:pk>/list",
            views.json_api.WorkspaceUserEndpoint.list,
            name="workspace-user--list",
        ),
        path(
            "workspace-user/<int:pk>/list-available",
            views.json_api.WorkspaceUserEndpoint.list_available,
            name="workspace-user--list-available",
        ),
        path(
            "workspace-user/<int:pk>/create",
            views.json_api.WorkspaceUserEndpoint.create,
            name="workspace-user--create",
        ),
        path(
            "workspace-user/<int:pk>/delete",
            views.json_api.WorkspaceUserEndpoint.delete,
            name="workspace-user--delete",
        ),
        path(
            "workspace-user/<int:pk>/update",
            views.json_api.WorkspaceUserEndpoint.update,
            name="workspace-user--update",
        ),
        ##########################################################
        # NODE
        #########################################################
        path(
            "node/create",
            views.json_api.NodeEndpoint.create,
            name="json-api-post-new-node",
        ),
        # @todo what's the difference between this and node/link to workflow
        path(
            "node-link/create",
            views.json_api.NodeEndpoint.node_link__create,
            name="json-api-post-new-node-link",
        ),
        #########################################################
        # import / export
        #########################################################
        path(
            "import",
            views.json_api.ExportImport.object__import,
            name="json-api-post-import-data",
        ),
        path(
            "export",
            views.json_api.ExportImport.object__export,
            name="json-api-post-get-export",
        ),
        #########################################################
        # Outcomes
        #########################################################
        path(
            "outcome/update-outcomehorizontallink-degree",
            views.json_api.workflow_objects.json_api_post_update_outcomehorizontallink_degree,
            name="json-api-post-update-outcomehorizontallink-degree",
        ),
        #########################################################
        # Library
        # these routes need a domain and this is it for now....
        # could be grouped under 'user'
        # make a deision
        # these should be grouped under the domain
        # i.e. projects
        # but leave until the rest is sorted out
        #########################################################
        path(
            "library/home",
            views.json_api.LibraryEndpoint.fetch__home,
            name="library--home",
        ),
        path(
            "library/favourites",
            views.json_api.LibraryEndpoint.fetch__favourite_library_objects,
            name="library--favourites--projects--get",
        ),
        path(
            "library/objects-search",
            views.json_api.LibraryEndpoint.search,
            name="library--library--objects-search--post",
        ),
        path(
            "library/toggle-favourite",
            views.json_api.LibraryEndpoint.toggle_favourite,
            name="library--toggle-favourite--post",
        ),
        #########################################################
        # User
        #########################################################
        path(
            "user/current-user",
            views.json_api.UserEndpoint.fetch__current,
            name="user--current-user",
        ),
        path(
            "user/list",
            views.json_api.UserEndpoint.list,
            name="user--list--post",
        ),
        #########################################################
        # User: profile settings
        #########################################################
        path(
            "user/profile-settings",
            views.json_api.UserEndpoint.fetch_profile_settings,
            name="user--profile-settings",
        ),
        path(
            "user/profile-settings/update",
            views.json_api.UserEndpoint.update_profile_settings,
            name="user--profile-settings--update",
        ),
        path(
            "user/notifications-settings",
            views.json_api.UserEndpoint.fetch_notification_settings,
            name="user--notification-settings",
        ),
        path(
            "user/notifications-settings/update",
            views.json_api.UserEndpoint.update_notification_settings,
            name="user--notification-settings--update",
        ),
        #########################################################
        # notifications
        # convert this to user/notifications/*
        #########################################################
        path(
            "notification/list",
            views.json_api.NotificationEndPoint.list,
            name="notification--list--get",
        ),
        path(
            "notification/<int:pk>/delete",
            views.json_api.NotificationEndPoint.delete,
            name="notification--delete--post",
        ),
        path(
            "notification/mark-all-as-read",
            views.json_api.NotificationEndPoint.mark_all_as_read,
            name="notifications--mark-all-as-read--post",
        ),
        #########################################################
        # Comment
        #########################################################
        path(
            "comment/create",
            views.json_api.CommentEndpoint.create,
            name="comment--create--post",
        ),
        path(
            "comment/list-by-object",
            views.json_api.CommentEndpoint.list_by_object,
            name="comment--list-by-object--post",
        ),
        path(
            "comment/<int:pk>/delete",
            views.json_api.CommentEndpoint.delete,
            name="comment--delete--post",
        ),
        path(
            "comment/delete-all",
            views.json_api.CommentEndpoint.delete_all,
            name="comment--delete-all--post",
        ),
        #########################################################
        # Misc / to sort
        #########################################################
        # path(
        #     "permissions/set",
        #     views.json_api.sharing.json_api_post_set_permission,
        #     name="json-api-post-set-permission",
        # ),
    ]


patterns = json_api_patterns()
