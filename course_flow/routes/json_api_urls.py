#########################################################
# Define All JSON Routes
#########################################################
from django.urls import path
from rest_framework import routers

from course_flow import views
from course_flow.views.json_api.library import LibraryEndpoint
from course_flow.views.json_api.notification import NotificationEndPoint
from course_flow.views.json_api.project import ProjectEndpoint
from course_flow.views.json_api.user import UserEndpoint
from course_flow.views.json_api.workflow_objects import (
    outcome,
    workflow_objects,
)
from course_flow.views.json_api.workflow_objects.column import ColumnEndpoint
from course_flow.views.json_api.workflow_objects.comment import CommentEndpoint
from course_flow.views.json_api.workflow_objects.node import NodeEndpoint
from course_flow.views.json_api.workflow_objects.week import WeekEndpoint
from course_flow.views.json_api.workflow_objects.workflow import (
    WorkflowEndpoint,
)
from course_flow.views.json_api.workflow_objects.workflow_objects import (
    WorkflowObjectEndpoint,
)
from course_flow.views.json_api.workspace import WorkspaceEndpoint
from course_flow.views.json_api.workspace_user import WorkspaceUserEndpoint

router = routers.SimpleRouter()

#########################################################
# PROJECT
#########################################################
project_endpoints = [
    path(
        "project/create",
        ProjectEndpoint.create,
        name="project--create",
    ),
    path(
        "project/<int:pk>/duplicate",
        ProjectEndpoint.duplicate,
        name="project--duplicate",
    ),
    path(
        "project/<int:pk>/detail",
        ProjectEndpoint.fetch_detail,
        name="project--detail",
    ),
    path(
        "project/my-projects",
        ProjectEndpoint.list_my_projects,
        name="project--my-projects",
    ),
    ### NEW
    path(
        "project/<int:pk>/delete-soft",
        WorkspaceEndpoint.delete_soft,
        name="project--delete-soft",
    ),
    path(
        "project/<int:pk>/restore",
        WorkspaceEndpoint.restore,
        name="project--restore",
    ),
    path(
        "project/<int:pk>/update",
        ProjectEndpoint.update,
        name="project--update",
    ),
    path(
        "project/<int:pk>/delete",
        WorkspaceEndpoint.delete,
        name="project--delete",
    ),
    #########################################################
    # RELATIONS
    #########################################################
    path(
        "project/<int:pk>/object-set/create",
        ProjectEndpoint.object_set__create,
        name="json-api-post-add-object-set",
    ),
    path(
        "project/<int:pk>/workflow",
        ProjectEndpoint.workflows__list,
        name="project--workflows--list",
    ),
    ######## to sort ######
    path(
        "project/from-json",
        views.json_api.old_courseflow_import.json_api_post_project_from_json,
        name="json-api-post-project-from-json",
    ),
]

#########################################################
# WORKFLOW
#########################################################
workflow_endpoints = [
    path(
        "workflow/<int:pk>/detail",
        WorkflowEndpoint.fetch_detail,
        name="workflow--detail",
    ),
    path(
        "workflow/<int:pk>/parent/detail",
        WorkflowEndpoint.fetch_parent_detail,
        name="workflow--parent--detail",
    ),
    # @todo this is really, get workflows by node
    path(
        "workflow/<int:pk>/parent/detail-full",
        WorkflowEndpoint.fetch_parent_detail_full,
        name="workflow--parent--detail--full",
    ),
    # @todo this is really, get workflows by node
    path(
        "workflow/<int:pk>/child/detail",
        WorkflowEndpoint.fetch_child_workflow_data,
        name="json-api-post-get-workflow-child-data",
    ),
    ######################################################
    # OTHER LISTS
    #########################################################
    path(
        "workflow/linked",
        WorkflowEndpoint.possible_linked,
        name="json-api-post-get-possible-linked-workflows",
    ),
    path(
        "workflow/added",
        WorkflowEndpoint.possible_added,
        name="json-api-post-get-possible-added-workflows",
    ),
    #########################################################
    # PUBLIC
    #########################################################
    path(
        "workflow/<int:pk>/public/detail",
        views.json_api.workflow_objects.workflow.json_api_get_public_workflow_data,
        name="json-api-get-public-workflow-data",
    ),
    path(
        "workflow/<int:pk>/public/parent/detail",
        views.json_api.workflow_objects.workflow.json_api_get_public_workflow_parent_data,
        name="json-api-get-public-workflow-parent-data",
    ),
    # @todo this is really, get workflows by node
    path(
        "workflow/<int:pk>/public/parent/detail-full",
        views.json_api.workflow_objects.workflow.json_api_get_public_parent_workflow_info,
        name="json-api-get-public-parent-workflow-info",
    ),
    # @todo this is really, get workflows by node
    path(
        "workflow/<int:pk>/public/child/detail",
        views.json_api.workflow_objects.workflow.json_api_get_public_workflow_child_data,
        name="json-api-get-public-workflow-child-data",
    ),
    ######################################################
    # EDITING
    #########################################################
    path(
        "workflow/create",
        WorkflowEndpoint.create,
        name="workflow--create",
    ),
    path(
        "workflow/<int:pk>/update",
        WorkflowEndpoint.update,
        name="workflow--update",
    ),
    path(
        "workflow/<int:pk>/duplicate-to-project",
        WorkflowEndpoint.duplicate_to_project,
        name="workflow--duplicate-to-project",
    ),
    path(
        "workflow/<int:pk>/delete-soft",
        WorkspaceEndpoint.delete_soft,
        name="workflow--delete-soft",
    ),
    path(
        "workflow/<int:pk>/restore",
        WorkspaceEndpoint.restore,
        name="workflow--restore-self",
    ),
    path(
        "workflow/<int:pk>/delete",
        WorkspaceEndpoint.delete,
        name="workflow--delete",
    ),
    #########################################################
    # RELATIONS
    #########################################################
    # path(
    #     "workflow/<int:pk>/link-to-node",
    #     WorkflowEndpoint.link_to_node,
    #     name="json-api-post-set-linked-workflow",
    # ),
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
        WorkflowObjectEndpoint.insert_sibling,
        name="workflow--object--insert-sibling",
    ),
    path(
        "workflow/object/duplicate",
        WorkflowObjectEndpoint.duplicate,
        name="workflow--object--duplicate",
    ),
    path(
        "workflow/object/order",
        WorkflowObjectEndpoint.order,
        name="workflow--object--order",
    ),
    #### SORT #####
    # @todo so is this just for outomces>
    path(
        "workflow/outcome/insert-child",
        outcome.json_api_post_insert_child_outcome,
        name="json-api-post-insert-child",
    ),
    path(
        "workflow/outcome/create",
        outcome.json_api_post_new_outcome_for_workflow,
        name="json-api-post-new-outcome-for-workflow",
    ),
    path(
        "workflow/update-outcomenode-degree",
        views.workflow_objects.outcome.json_api_post_update_outcomenode_degree,
        name="json-api-post-update-outcomenode-degree",
    ),
    path(
        "workflow/updateobjectset",
        workflow_objects.json_api_post_update_object_set,
        name="json-api-post-update-object-set",
    ),
]

##########################################################
# WORKSPACE
##########################################################
workspace_endpoints = [
    path(
        "workspace/<int:pk>/delete-soft",
        WorkspaceEndpoint.delete_soft,
        name="json-api-post-delete-self-soft",
    ),
    path(
        "workspace/<int:pk>/restore",
        WorkspaceEndpoint.restore,
        name="json-api-post-restore-self",
    ),
    path(
        "workspace/<int:pk>/delete",
        WorkspaceEndpoint.delete,
        name="json-api-post-delete-self",
    ),
    path(
        "workspace/<int:pk>/update-field",
        WorkspaceEndpoint.update_value,
        name="json-api-post-update-value",
    ),
]

#########################################################
# WORKSPACE USER
# i.e. the users who get added to a project or workflow
#########################################################
workspace_user_endpoints = [
    path(
        "workspace-user/<int:pk>/list",
        WorkspaceUserEndpoint.list,
        name="workspace-user--list",
    ),
    path(
        "workspace-user/<int:pk>/list-available",
        WorkspaceUserEndpoint.list_available,
        name="workspace-user--list-available",
    ),
    path(
        "workspace-user/<int:pk>/create",
        WorkspaceUserEndpoint.create,
        name="workspace-user--create",
    ),
    path(
        "workspace-user/<int:pk>/delete",
        WorkspaceUserEndpoint.delete,
        name="workspace-user--delete",
    ),
    path(
        "workspace-user/<int:pk>/update",
        WorkspaceUserEndpoint.update,
        name="workspace-user--update",
    ),
]

##########################################################
# COLUMN
#########################################################
column_endpoints = [
    path(
        "column/create",
        ColumnEndpoint.create,
        name="column--create",
    ),
    path(
        "column/<int:pk>/update_position",
        ColumnEndpoint.update_position,
        name="column--update-position",
    ),
    path(
        "column/<int:pk>/delete",
        ColumnEndpoint.delete,
        name="column--delete",
    ),
]

##########################################################
# NODE
#########################################################
node_endpoints = [
    path(
        "node/create",
        NodeEndpoint.create,
        name="node--create",
    ),
    path(
        "node/<int:pk>/delete",
        NodeEndpoint.delete,
        name="node--delete",
    ),
    path(
        "node/<int:pk>/delete-soft",
        NodeEndpoint.delete_soft,
        name="node--delete-soft",
    ),
    path(
        "node/<int:pk>/restore",
        NodeEndpoint.restore,
        name="node--restore",
    ),
    path(
        "node/<int:pk>/duplicate",
        NodeEndpoint.duplicate,
        name="node--duplicate",
    ),
    path(
        "node/<int:pk>/update-position",
        NodeEndpoint.update_position,
        name="node--update-position",
    ),
    path(
        "node/<int:pk>/link-to-workflow",
        NodeEndpoint.link_to_workflow,
        name="node--link-to-node",
    ),
    path(
        "node/node-link/create",
        NodeEndpoint.node_link__create,
        name="node-link--create",
    ),
]

##########################################################
# WEEK
#########################################################
week_endpoints = [
    path(
        "week/create",
        WeekEndpoint.create,
        name="week--create",
    ),
    path(
        "week/<int:pk>/duplicate",
        WeekEndpoint.duplicate,
        name="week--duplicate",
    ),
    path(
        "week/<int:pk>/change-position",
        WeekEndpoint.change_position,
        name="week--change-position",
    ),
    path(
        "week/<int:pk>/delete",
        WeekEndpoint.delete,
        name="week--delete",
    ),
]

#########################################################
# Outcomes
#########################################################
outcome_endpoint = [
    path(
        "outcome/update-outcomehorizontallink-degree",
        views.workflow_objects.workflow_objects.json_api_post_update_outcomehorizontallink_degree,
        name="json-api-post-update-outcomehorizontallink-degree",
    ),
]

user_endpoint = [
    #########################################################
    # User
    #########################################################
    path(
        "user/current-user",
        UserEndpoint.fetch__current,
        name="user--current-user",
    ),
    path(
        "user/list",
        UserEndpoint.list,
        name="user--list--post",
    ),
    #########################################################
    # User: profile settings
    #########################################################
    path(
        "user/profile-settings",
        UserEndpoint.fetch_profile_settings,
        name="user--profile-settings",
    ),
    path(
        "user/profile-settings/update",
        UserEndpoint.update_profile_settings,
        name="user--profile-settings--update",
    ),
    path(
        "user/notifications-settings",
        UserEndpoint.fetch_notification_settings,
        name="user--notification-settings",
    ),
    path(
        "user/notifications-settings/update",
        UserEndpoint.update_notification_settings,
        name="user--notification-settings--update",
    ),
]

#########################################################
# Library
# these routes need a domain and this is it for now....
# could be grouped under 'user'
# make a deision
# these should be grouped under the domain
# i.e. projects
# but leave until the rest is sorted out
#########################################################
library_endpoint = [
    path(
        "library/home",
        LibraryEndpoint.fetch__home,
        name="library--home",
    ),
    path(
        "library/favourites",
        LibraryEndpoint.fetch__favourite_library_objects,
        name="library--favourites--projects--get",
    ),
    path(
        "library/objects-search",
        LibraryEndpoint.search,
        name="library--library--objects-search--post",
    ),
    path(
        "library/toggle-favourite",
        LibraryEndpoint.toggle_favourite,
        name="library--toggle-favourite--post",
    ),
]

notification_endpoint = [
    #########################################################
    # notifications
    # convert this to user/notifications/*
    #########################################################
    path(
        "notification/list",
        NotificationEndPoint.list,
        name="notification--list--get",
    ),
    path(
        "notification/<int:pk>/delete",
        NotificationEndPoint.delete,
        name="notification--delete--post",
    ),
    path(
        "notification/mark-all-as-read",
        NotificationEndPoint.mark_all_as_read,
        name="notifications--mark-all-as-read--post",
    ),
]

comments_endpoint = [
    #########################################################
    # Comment
    #########################################################
    path(
        "comment/create",
        CommentEndpoint.create,
        name="comment--create--post",
    ),
    path(
        "comment/list-by-object",
        CommentEndpoint.list_by_object,
        name="comment--list-by-object--post",
    ),
    path(
        "comment/<int:pk>/delete",
        CommentEndpoint.delete,
        name="comment--delete--post",
    ),
    path(
        "comment/delete-all",
        CommentEndpoint.delete_all,
        name="comment--delete-all--post",
    ),
]

misc_endpoint = [
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
    # Misc / to sort
    #########################################################
    # path(
    #     "permissions/set",
    #     views.json_api.sharing.json_api_post_set_permission,
    #     name="json-api-post-set-permission",
    # ),
]

patterns = (
    project_endpoints
    + workflow_endpoints
    + workspace_endpoints
    + workspace_user_endpoints
    + node_endpoints
    + outcome_endpoint
    + user_endpoint
    + library_endpoint
    + notification_endpoint
    + comments_endpoint
    + misc_endpoint
)
