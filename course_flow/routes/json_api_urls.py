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
        # Workflow
        #########################################################
        path(
            "workflow/detail",
            views.json_api.workflow.json_api__workflow__detail__get,
            name="workflow--detail--get",
        ),
        path(
            "workflow/node/new",
            views.json_api.create.json_api_post_new_node,
            name="json-api-post-new-node",
        ),
        path(
            "workflow/outcome/new",
            views.json_api.create.json_api_post_new_outcome_for_workflow,
            name="json-api-post-new-outcome-for-workflow",
        ),
        path(
            "workflow/strategy/add",
            views.json_api.strategy.json_api_post_add_strategy,
            name="json-api-post-add-strategy",
        ),
        path(
            "workflow/node-link/new",
            views.json_api.node_link.json_api_post_new_node_link,
            name="json-api-post-new-node-link",
        ),
        path(
            "workflow/insert-sibling",
            views.json_api.create.json_api_post_insert_sibling,
            name="json-api-post-insert-sibling",
        ),
        path(
            "workflow/insert-child",
            views.json_api.create.json_api_post_insert_child,
            name="json-api-post-insert-child",
        ),
        path(
            "workflow/delete-self",
            views.json_api.delete.json_api_post_delete_self,
            name="json-api-post-delete-self",
        ),
        path(
            "workflow/restore-self",
            views.json_api.delete.json_api_post_restore_self,
            name="json-api-post-restore-self",
        ),
        path(
            "workflow/delete-self-soft",
            views.json_api.delete.json_api_post_delete_self_soft,
            name="json-api-post-delete-self-soft",
        ),
        path(
            "workflow/duplicate-self",
            views.json_api.duplication.json_api_post_duplicate_self,
            name="json-api-post-duplicate-self",
        ),
        path(
            "workflow/updatevalue",
            views.json_api.update.json_api_post_update_value,
            name="json-api-post-update-value",
        ),
        path(
            "workflow/inserted-at",
            views.json_api.update.json_api_post_inserted_at,
            name="json-api-post-inserted-at",
        ),
        path(
            "workflow/update-outcomenode-degree",
            views.json_api.update.json_api_post_update_outcomenode_degree,
            name="json-api-post-update-outcomenode-degree",
        ),
        path(
            "workflow/get-workflow-data",
            views.json_api.workflow.json_api_post_get_workflow_data,
            name="json-api-post-get-workflow-data",
        ),
        path(
            "workflow/get-workflow-parent-data",
            views.json_api.workflow.json_api_post_get_workflow_parent_data,
            name="json-api-post-get-workflow-parent-data",
        ),
        path(
            "workflow/get-workflow-child-data",
            views.json_api.workflow.json_api_post_get_workflow_child_data,
            name="json-api-post-get-workflow-child-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-data",
            views.json_api.workflow.json_api_get_public_workflow_data,
            name="json-api-get-public-workflow-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-parent-data",
            views.json_api.workflow.json_api_get_public_workflow_parent_data,
            name="json-api-get-public-workflow-parent-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-child-data",
            views.json_api.workflow.json_api_get_public_workflow_child_data,
            name="json-api-get-public-workflow-child-data",
        ),
        path(
            "workflow/get-workflow-context",
            views.json_api.workflow.json_api_post_get_workflow_context,
            name="json-api-post-get-workflow-context",
        ),
        path(
            "workflow/get-target-projects",
            views.json_api.workflow.json_api_post_get_target_projects,
            name="json-api-post-get-target-projects",
        ),
        path(
            "workflow/<int:pk>/get-public-parent-workflow-info",
            views.json_api.workflow.json_api_get_public_parent_workflow_info,
            name="json-api-get-public-parent-workflow-info",
        ),
        path(
            "parentworkflows/get",
            views.json_api.workflow.json_api_post_get_parent_workflow_info,
            name="json-api-post-get-parent-workflow-info",
        ),
        path(
            "workflow/get-possible-linked-workflows",
            views.json_api.workflow.json_api_post_get_possible_linked_workflows,
            name="json-api-post-get-possible-linked-workflows",
        ),
        path(
            "workflow/get-possible-added-workflows",
            views.json_api.workflow.json_api_post_get_possible_added_workflows,
            name="json-api-post-get-possible-added-workflows",
        ),
        path(
            "workflow/node/set-linked-workflow",
            views.json_api.update.json_api_post_set_linked_workflow,
            name="json-api-post-set-linked-workflow",
        ),
        path(
            "workflow/strategy/toggle",
            views.json_api.update.json_api_post_week_toggle_strategy,
            name="json-api-post-toggle-strategy",
        ),
        path(
            "workflow/updateobjectset",
            views.json_api.update.json_api_post_update_object_set,
            name="json-api-post-update-object-set",
        ),
        path(
            "project/duplicate-workflow",
            views.json_api.workflow.json_api_post_duplicate_workflow,
            name="json-api-post-duplicate-workflow",
        ),
        #########################################################
        # Project
        #########################################################
        path(
            "project/detail",
            views.json_api.project.json_api__project__detail__get,
            name="project--detail--get",
        ),
        path(
            "project/create",
            views.json_api.project.project__create__post,
            name="project--create--post",
        ),
        path(
            "project/duplicate-project",
            views.json_api.project.json_api_post_duplicate_project,
            name="json-api-post-duplicate-project",
        ),
        path(
            "project/get-workflows-for-project",
            views.json_api.workflow.json_api_post_get_workflows_for_project,
            name="json-api-post-get-workflows-for-project",
        ),
        path(
            "project/get-project-data",
            views.json_api.workflow.json_api_post_get_project_data,
            name="json-api-post-get-project-data",
        ),
        path(
            "project/get-users-for-object",
            views.json_api.sharing.json_api_post_get_users_for_object,
            name="json-api-post-get-users-for-object",
        ),
        path(
            "project/from-json",
            views.json_api.old_courseflow_import.json_api_post_project_from_json,
            name="json-api-post-project-from-json",
        ),
        path(
            "project/duplicate-strategy",
            views.json_api.strategy.json_api_post_duplicate_strategy,
            name="json-api-post-duplicate-strategy",
        ),
        # not used anywhere
        path(
            "project/discipline/list",
            views.json_api.project.json_api__project__discipline__list,
            name="project--discipline--list",
        ),
        #########################################################
        # import / export
        #########################################################
        path(
            "imports/import-data",
            views.json_api.export_import.json_api_post_import_data,
            name="json-api-post-import-data",
        ),
        path(
            "exports/get",
            views.json_api.export_import.json_api_post_get_export,
            name="json-api-post-get-export",
        ),
        #########################################################
        # Outcomes
        #########################################################
        path(
            "outcome/update-outcomehorizontallink-degree",
            views.json_api.update.json_api_post_update_outcomehorizontallink_degree,
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
            views.json_api.library.json_api__library__home,
            name="library--home",
        ),
        path(
            "library/explore",
            views.json_api.library.json_api__library__explore,
            name="library--explore",
        ),
        path(
            "library/library/projects",
            views.json_api.library.json_api__library__library__projects__get,
            name="library--library--projects--get",
        ),
        path(
            "library/favourites/projects",
            views.json_api.library.json_api__library__favourites__projects__get,
            name="library--favourites--projects--get",
        ),
        path(
            "library/library/objects-search",
            views.json_api.library.json_api___library__library__objects_search__post,
            name="library--library--objects-search--post",
        ),
        #########################################################
        # User
        #########################################################
        path(
            "user/list",
            views.json_api.user.json_api__user__list__post,
            name="user--list--post",
        ),
        #########################################################
        # User: profile settings
        #########################################################
        path(
            "user/profile-settings",
            views.json_api.user.json_api__user__profile_settings__get,
            name="user--profile-settings--get",
        ),
        path(
            "user/profile-settings/update",
            views.json_api.user.json_api__user__profile_settings__update__post,
            name="user--profile-settings--update--post",
        ),
        path(
            "user/notifications-settings",
            views.json_api.user.json_api__user__notification_settings__get,
            name="user--notification-settings--get",
        ),
        path(
            "user/notifications-settings/update",
            views.json_api.user.json_api__user__notification_settings__post,
            name="user--notification-settings--update--post",
        ),
        # move this
        path(
            "favourite/toggle",
            views.json_api.user.json_api__favourite__toggle__post,
            name="favourite--toggle--post",
        ),
        #########################################################
        # notifications
        # convert this to user/notifications/*
        #########################################################
        path(
            "notification/list",
            views.json_api.notification.json_api__notification__list__get,
            name="notification--list--get",
        ),
        # @todo verify but looks unused
        path(
            "notification/delete",
            views.json_api.notification.json_api__notification__delete__post,
            name="notification--delete--post",
        ),
        path(
            "notification/mark-all-as-read",
            views.json_api.notification.json_api__notification__mark_all_as_read__post,
            name="notifications--mark-all-as-read--post",
        ),
        path(
            "notification/select",
            views.json_api.notification.json_api__notification__select__post,
            name="notifications--select--post",
        ),
        #########################################################
        # Comment
        #########################################################
        path(
            "comment/list",
            views.json_api.comment.json_api__comment__list_by_object__post,
            name="comment--list-by-object--post",
        ),
        path(
            "comment/create",
            views.json_api.comment.json_api__comment__create__post,
            name="comment--create--post",
        ),
        path(
            "comment/delete",
            views.json_api.comment.json_api__comment__delete__post,
            name="comment--delete--post",
        ),
        path(
            "comment/delete-all",
            views.json_api.comment.json_api__comment__delete_all__post,
            name="comment--delete-all--post",
        ),
        #########################################################
        # Misc / to sort
        #########################################################
        path(
            "terminology/add",
            views.json_api.project.json_api_post_add_object_set,
            name="json-api-post-add-object-set",
        ),
        path(
            "permissions/set",
            views.json_api.sharing.json_api_post_set_permission,
            name="json-api-post-set-permission",
        ),
    ]


patterns = json_api_patterns()
