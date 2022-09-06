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
        path("logout/", views.logout_view, name="logout"),
        path("myprojects/", views.myprojects_view, name="my-projects"),
        path("myliveprojects/", views.my_live_projects_view, name="my-live-projects"),
        path("mytemplates/", views.mytemplates_view, name="my-templates"),
        path("myshared/", views.myshared_view, name="my-shared"),
        path("myfavourites/", views.myfavourites_view, name="my-favourites"),
        path("explore/", views.ExploreView.as_view(), name="explore"),
        path("import/", views.import_view, name="import"),
        path(
            "project/<int:pk>/",
            views.ProjectDetailView.as_view(),
            name="project-update",
        ),
        path(
            "liveproject/<int:pk>/",
            views.LiveProjectDetailView.as_view(),
            name="liveproject-update",
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
            ratelimit(key="ip",method=["GET"],rate="5/m",block=True)(views.WorkflowPublicDetailView.as_view()),
            name="workflow-public",
        ),
        path(
            "workflow/updatevalue/", views.update_value, name="update-value"
        ),
        path("workflow/delete-self/", views.delete_self, name="delete-self"),
        path(
            "workflow/restore-self/",
            views.restore_self,
            name="restore-self",
        ),
        path(
            "workflow/delete-self-soft/",
            views.delete_self_soft,
            name="delete-self-soft",
        ),
        path(
            "workflow/update-outcomenode-degree/",
            views.update_outcomenode_degree,
            name="update-outcomenode-degree",
        ),
        path(
            "workflow/duplicate-self/",
            views.duplicate_self,
            name="duplicate-self",
        ),
        path(
            "project/duplicate-workflow/",
            views.duplicate_workflow_ajax,
            name="duplicate-workflow",
        ),
        path(
            "project/duplicate-project/",
            views.duplicate_project_ajax,
            name="duplicate-project",
        ),
        path(
            "project/duplicate-strategy/",
            views.duplicate_strategy_ajax,
            name="duplicate-strategy",
        ),
        path(
            "workflow/insert-sibling/",
            views.insert_sibling,
            name="insert-sibling",
        ),
        path(
            "workflow/insert-child/",
            views.insert_child,
            name="insert-child",
        ),
        path("workflow/inserted-at/", views.inserted_at, name="inserted-at"),
        path(
            "outcome/update-outcomehorizontallink-degree/",
            views.update_outcomehorizontallink_degree,
            name="update-outcomehorizontallink-degree",
        ),
        path("workflow/node/new", views.new_node, name="new-node"),
        path(
            "workflow/outcome/new",
            views.new_outcome_for_workflow,
            name="new-outcome-for-workflow",
        ),
        path(
            "workflow/strategy/add", views.add_strategy, name="add-strategy"
        ),
        path(
            "workflow/strategy/toggle",
            views.week_toggle_strategy,
            name="toggle-strategy",
        ),
        path(
            "project/from-json/",
            views.project_from_json,
            name="project-from-json",
        ),
        path(
            "project/get-disciplines/",
            views.DisciplineListView.as_view(),
            name="get-disciplines",
        ),
        path(
            "favourites/toggle",
            views.toggle_favourite,
            name="toggle-favourite",
        ),
        path("permissions/set", views.set_permission, name="set-permission"),
        path(
            "workflow/node/set-linked-workflow/",
            views.set_linked_workflow_ajax,
            name="set-linked-workflow",
        ),
        path(
            "workflow/node-link/new",
            views.new_node_link,
            name="new-node-link",
        ),
        path(
            "workflow/get-possible-linked-workflows/",
            views.get_possible_linked_workflows,
            name="get-possible-linked-workflows",
        ),
        path(
            "workflow/get-possible-added-workflows/",
            views.get_possible_added_workflows,
            name="get-possible-added-workflows",
        ),
        path(
            "workflow/get-workflow-context/",
            views.get_workflow_context,
            name="get-workflow-context",
        ),
        path(
            "workflow/get-target-projects/",
            views.get_target_projects,
            name="get-target-projects",
        ),
        path(
            "workflow/get-workflow-data/",
            views.get_workflow_data,
            name="get-workflow-data",
        ),
        path(
            "workflow/get-workflow-parent-data/",
            views.get_workflow_parent_data,
            name="get-workflow-parent-data",
        ),
        path(
            "workflow/get-workflow-child-data/",
            views.get_workflow_child_data,
            name="get-workflow-child-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-data/",
            views.get_public_workflow_data,
            name="get-public-workflow-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-parent-data/",
            views.get_public_workflow_parent_data,
            name="get-public-workflow-parent-data",
        ),
        path(
            "workflow/<int:pk>/get-public-workflow-child-data/",
            views.get_public_workflow_child_data,
            name="get-public-workflow-child-data",
        ),
        path(
            "project/get-project-data/",
            views.get_project_data,
            name="get-project-data",
        ),
        # path(
        #     "outcome/get-outcome-data/",
        #     views.get_outcome_data,
        #     name="get-outcome-data",
        # ),
        path(
            "project/get-users-for-object/",
            views.get_users_for_object,
            name="get-users-for-object",
        ),
        path(
            "users/get-user-list/",
            views.get_user_list,
            name="get-user-list",
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
            "comments/get/",
            views.get_comments_for_object,
            name="get-comments-for-object",
        ),
        path(
            "terminology/add/",
            views.add_terminology,
            name="add-terminology",
        ),
        path(
            "workflow/updateobjectset/",
            views.update_object_set,
            name="update-object-set",
        ),
        path("comments/add/", views.add_comment, name="add-comment",),
        path(
            "comments/remove/", views.remove_comment, name="remove-comment",
        ),
        path(
            "comments/removeall/",
            views.remove_all_comments,
            name="remove-all-comments",
        ),
        path(
            "parentworkflows/get/",
            views.get_parent_workflow_info,
            name="get-parent-workflow-info",
        ),
        path("exports/get/", views.get_export, name="get-export",),
        path("imports/import-data/", views.import_data, name="import-data",),
        path(
            "downloads/exports/get/",
            views.get_export_download,
            name="get-export-download",
        ),
        path(
            "jsi18n/", JavaScriptCatalog.as_view(), name="javascript-catalog"
        ),
    ] + router.urls


urlpatterns = course_flow_patterns()
