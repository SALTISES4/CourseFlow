from django.urls import path
from django.views.i18n import JavaScriptCatalog
from ratelimit.decorators import ratelimit
from rest_framework import routers

from . import views

router = routers.SimpleRouter()


app_name = "course_flow"


def course_flow_patterns():
    return [
        path("home/", views.home_view, name="home"),
        path(
            "saltise-admin/",
            views.SALTISEAdminView.as_view(),
            name="saltise-admin",
        ),
        path(
            "admin/saltise-analytics",
            views.SALTISEAnalyticsView.as_view(),
            name="saltise-analytics",
        ),
        path("logout/", views.logout_view, name="logout"),
        path("mylibrary/", views.mylibrary_view, name="my-library"),
        # path("myprojects/", views.myprojects_view, name="my-projects"),
        # path("mytemplates/", views.mytemplates_view, name="my-templates"),
        # path("myshared/", views.myshared_view, name="my-shared"),
        path("myfavourites/", views.myfavourites_view, name="my-favourites"),
        path("explore/", views.ExploreView.as_view(), name="explore"),
        path("import/", views.import_view, name="import"),
        path(
            "project/<int:pk>/",
            views.ProjectDetailView.as_view(),
            name="project-update",
        ),
        path(
            "project/<int:pk>/comparison",
            views.ProjectComparisonView.as_view(),
            name="project-comparison",
        ),
        path(
            "workflow/<int:pk>/",
            views.WorkflowDetailView.as_view(),
            name="workflow-update",
        ),
        path(
            "workflow/public/<int:pk>/",
            ratelimit(key="ip", method=["GET"], rate="5/m", block=True)(
                views.WorkflowPublicDetailView.as_view()
            ),
            name="workflow-public",
        ),
        path(
            "project/get-disciplines/",
            views.DisciplineListView.as_view(),
            name="get-disciplines",
        ),
        path(
            "user/update/",
            views.user.profile_settings_view,
            name="user-update",
        ),
        path(
            "user/notifications/",
            views.user.notifications_view,
            name="user-notifications",
        ),
        path(
            "user/notifications-settings/",
            views.user.notifications_settings_view,
            name="user-notifications-settings",
        ),
        path(
            "project/create/",
            views.ProjectCreateView.as_view(),
            name="project-create",
        ),
        path(
            "program/<int:projectPk>/create/",
            views.ProgramCreateView.as_view(),
            name="program-create",
        ),
        path(
            "course/<int:projectPk>/create/",
            views.CourseCreateView.as_view(),
            name="course-create",
        ),
        path(
            "course-strategy/create/",
            views.CourseStrategyCreateView.as_view(),
            name="course-strategy-create",
        ),
        path(
            "activity/<int:projectPk>/create/",
            views.ActivityCreateView.as_view(),
            name="activity-create",
        ),
        path(
            "activity-strategy/create/",
            views.ActivityStrategyCreateView.as_view(),
            name="activity-strategy-create",
        ),
        path(
            "downloads/saltise/get/",
            views.get_saltise_download,
            name="get-saltise-download",
        ),
        path(
            "jsi18n/", JavaScriptCatalog.as_view(), name="javascript-catalog"
        ),
        # Register create JSON routes
        path(
            "json-api-post-update-profile-settings/",
            views.json_api.update.json_api_post_profile_settings,
            name="json-api-post-update-profile-settings",
        ),
        path(
            "json-api-post-notifications-settings/",
            views.json_api.update.json_api_post_notifications_settings,
            name="json-api-post-notifications-settings",
        ),
        path(
            "comments/add/",
            views.json_api.comment.json_api_post_add_comment,
            name="json-api-post-add-comment",
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
            views.json_api.create.json_api_post_add_strategy,
            name="json-api-post-add-strategy",
        ),
        path(
            "workflow/node-link/new",
            views.json_api.create.json_api_post_new_node_link,
            name="json-api-post-new-node-link",
        ),
        path(
            "workflow/insert-sibling/",
            views.json_api.create.json_api_post_insert_sibling,
            name="json-api-post-insert-sibling",
        ),
        path(
            "workflow/insert-child/",
            views.json_api.create.json_api_post_insert_child,
            name="json-api-post-insert-child",
        ),
        path(
            "terminology/add/",
            views.json_api.create.json_api_post_add_object_set,
            name="json-api-post-add-object-set",
        ),
        # Register delete JSON routes
        path(
            "workflow/delete-self/",
            views.json_api.delete.json_api_post_delete_self,
            name="json-api-post-delete-self",
        ),
        path(
            "workflow/restore-self/",
            views.json_api.delete.json_api_post_restore_self,
            name="json-api-post-restore-self",
        ),
        path(
            "workflow/delete-self-soft/",
            views.json_api.delete.json_api_post_delete_self_soft,
            name="json-api-post-delete-self-soft",
        ),
        path(
            "comments/remove/",
            views.json_api.comment.json_api_post_remove_comment,
            name="json-api-post-remove-comment",
        ),
        path(
            "comments/removeall/",
            views.json_api.comment.json_api_post_remove_all_comments,
            name="json-api-post-remove-all-comments",
        ),
        # Register Duplication JSON routes
        path(
            "project/duplicate-workflow/",
            views.json_api.duplication.json_api_post_duplicate_workflow,
            name="json-api-post-duplicate-workflow",
        ),
        path(
            "project/duplicate-strategy/",
            views.json_api.duplication.json_api_post_duplicate_strategy,
            name="json-api-post-duplicate-strategy",
        ),
        path(
            "project/duplicate-project/",
            views.json_api.duplication.json_api_post_duplicate_project,
            name="json-api-post-duplicate-project",
        ),
        path(
            "workflow/duplicate-self/",
            views.json_api.duplication.json_api_post_duplicate_self,
            name="json-api-post-duplicate-self",
        ),
        # Register export/import JSON routes
        path(
            "imports/import-data/",
            views.json_api.export_import.json_api_post_import_data,
            name="json-api-post-import-data",
        ),
        path(
            "exports/get/",
            views.json_api.export_import.json_api_post_get_export,
            name="json-api-post-get-export",
        ),
        # Register old courseflow import JSON route
        path(
            "project/from-json/",
            views.json_api.old_courseflow_import.json_api_post_project_from_json,
            name="json-api-post-project-from-json",
        ),
        # Register sharing JSON routes
        path(
            "permissions/set",
            views.json_api.sharing.json_api_post_set_permission,
            name="json-api-post-set-permission",
        ),
        path(
            "project/get-users-for-object/",
            views.json_api.sharing.json_api_post_get_users_for_object,
            name="json-api-post-get-users-for-object",
        ),
        path(
            "users/get-user-list/",
            views.json_api.sharing.json_api_post_get_user_list,
            name="json-api-post-get-user-list",
        ),
        path(
            "user/mark-all-as-read/",
            views.json_api.sharing.json_api_post_mark_all_notifications_as_read,
            name="json-api-post-mark-all-notifications-as-read",
        ),
        path(
            "user/delete-notification/",
            views.json_api.sharing.json_api_post_delete_notification,
            name="json-api-post-delete-notification",
        ),
        # Register search JSON routes
        path(
            "mylibrary/search-all-objects/",
            views.json_api.search.json_api_post_search_all_objects,
            name="json-api-post-search-all-objects",
        ),
        # Register update JSON routes
        path(
            "workflow/updatevalue/",
            views.json_api.update.json_api_post_update_value,
            name="json-api-post-update-value",
        ),
        path(
            "workflow/inserted-at/",
            views.json_api.update.json_api_post_inserted_at,
            name="json-api-post-inserted-at",
        ),
        path(
            "workflow/update-outcomenode-degree/",
            views.json_api.update.json_api_post_update_outcomenode_degree,
            name="json-api-post-update-outcomenode-degree",
        ),
        path(
            "outcome/update-outcomehorizontallink-degree/",
            views.json_api.update.json_api_post_update_outcomehorizontallink_degree,
            name="json-api-post-update-outcomehorizontallink-degree",
        ),
        path(
            "workflow/node/set-linked-workflow/",
            views.json_api.update.json_api_post_set_linked_workflow,
            name="json-api-post-set-linked-workflow",
        ),
        path(
            "workflow/strategy/toggle",
            views.json_api.update.json_api_post_week_toggle_strategy,
            name="json-api-post-toggle-strategy",
        ),
        path(
            "workflow/updateobjectset/",
            views.json_api.update.json_api_post_update_object_set,
            name="json-api-post-update-object-set",
        ),
        path(
            "favourites/toggle",
            views.json_api.update.json_api_post_toggle_favourite,
            name="json-api-post-toggle-favourite",
        ),
        # Register "API" JSON routes
        path(
            "json-api-get-top-bar/",
            views.json_api.menu.json_api_get_top_bar,
            name="json-api-get-top-bar",
        ),
        path(
            "json-api-get-sidebar/",
            views.json_api.menu.json_api_get_sidebar,
            name="json-api-get-sidebar",
        ),
        path(
            "mylibrary/get-projects/",
            views.json_api.menu.json_api_get_library,
            name="json-api-get-library",
        ),
        path(
            "favourites/get-projects/",
            views.json_api.menu.json_api_get_favourites,
            name="json-api-get-favourites",
        ),
        path(
            "user/select-notifications/",
            views.json_api.menu.json_api_post_select_notifications,
            name="json-api-post-select-notifications",
        ),
        # Register Workflow JSON routes
        path(
            "workflow/get-workflow-data/",
            views.json_api.workflow.json_api_post_get_workflow_data,
            name="json-api-post-get-workflow-data",
        ),
        path(
            "workflow/get-workflow-parent-data/",
            views.json_api.workflow.json_api_post_get_workflow_parent_data,
            name="json-api-post-get-workflow-parent-data",
        ),
        path(
            "workflow/get-workflow-child-data/",
            views.json_api.workflow.json_api_post_get_workflow_child_data,
            name="json-api-post-get-workflow-child-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-data/",
            views.json_api.workflow.json_api_get_public_workflow_data,
            name="json-api-get-public-workflow-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-parent-data/",
            views.json_api.workflow.json_api_get_public_workflow_parent_data,
            name="json-api-get-public-workflow-parent-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-child-data/",
            views.json_api.workflow.json_api_get_public_workflow_child_data,
            name="json-api-get-public-workflow-child-data",
        ),
        path(
            "workflow/get-workflow-context/",
            views.json_api.workflow.json_api_post_get_workflow_context,
            name="json-api-post-get-workflow-context",
        ),
        path(
            "workflow/get-target-projects/",
            views.json_api.workflow.json_api_post_get_target_projects,
            name="json-api-post-get-target-projects",
        ),
        path(
            "comments/get/",
            views.json_api.comment.json_api_post_get_comments_for_object,
            name="json-api-post-get-comments-for-object",
        ),
        path(
            "workflow/<int:pk>/get-public-parent-workflow-info/",
            views.json_api.workflow.json_api_get_public_parent_workflow_info,
            name="json-api-get-public-parent-workflow-info",
        ),
        path(
            "parentworkflows/get/",
            views.json_api.workflow.json_api_post_get_parent_workflow_info,
            name="json-api-post-get-parent-workflow-info",
        ),
        path(
            "project/get-workflows-for-project/",
            views.json_api.workflow.json_api_post_get_workflows_for_project,
            name="json-api-post-get-workflows-for-project",
        ),
        path(
            "project/get-project-data/",
            views.json_api.workflow.json_api_post_get_project_data,
            name="json-api-post-get-project-data",
        ),
        path(
            "workflow/get-possible-linked-workflows/",
            views.json_api.workflow.json_api_post_get_possible_linked_workflows,
            name="json-api-post-get-possible-linked-workflows",
        ),
        path(
            "workflow/get-possible-added-workflows/",
            views.json_api.workflow.json_api_post_get_possible_added_workflows,
            name="json-api-post-get-possible-added-workflows",
        ),
    ] + router.urls


urlpatterns = course_flow_patterns()
