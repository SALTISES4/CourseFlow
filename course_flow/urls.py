from django.conf.urls import url
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework import routers

from . import lti, views

router = routers.SimpleRouter()
router.register(r"activity/read", views.ActivityViewSet)
router.register(r"course/read", views.CourseViewSet)
router.register(r"program/read", views.ProgramViewSet)
router.register(r"workflow/read", views.WorkflowViewSet)
router.register(r"columnworkflow/read", views.ColumnWorkflowViewSet)
router.register(r"column/read", views.ColumnViewSet)
router.register(r"strategyworkflow/read", views.StrategyWorkflowViewSet)
router.register(r"strategy/read", views.StrategyViewSet)
router.register(r"nodestrategy/read", views.NodeStrategyViewSet)
router.register(r"node/read", views.NodeViewSet)
router.register(r"nodelink/read", views.NodeLinkViewSet)


app_name = "course_flow"


def flow_patterns():
    return [
        url(r"^register/$", views.registration_view, name="registration"),
        url(
            r"^login/$",
            auth_views.LoginView.as_view(
                template_name="course_flow/registration/login.html"
            ),
            name="login",
        ),
        url(r"^logout/$", auth_views.LogoutView.as_view(), name="logout"),
        url(r"home/$", views.home_view, name="home"),
        url(
            r"^project/(?P<pk>[0-9]+)/update/$",
            views.ProjectUpdateView.as_view(),
            name="project-update",
        ),
        url(
            r"^workflow/(?P<pk>[0-9]+)/update/$",
            views.WorkflowUpdateView.as_view(),
            name="workflow-update",
        ),
        url(
            r"^workflow/updatevalue/$", views.update_value, name="update-value"
        ),
        url(r"^workflow/delete-self/$", views.delete_self, name="delete-self"),
        url(
            r"^workflow/insert-sibling/$",
            views.insert_sibling,
            name="insert-sibling",
        ),
        url(r"^workflow/inserted-at/$", views.inserted_at, name="inserted-at"),
        url(r"^workflow/column/new", views.new_column, name="new-column"),
        url(r"^workflow/node/new", views.new_node, name="new-node"),
        url(
            r"^workflow/node/set-linked-workflow/$",
            views.set_linked_workflow_ajax,
            name="set-linked-workflow",
        ),
        url(
            r"^workflow/node-link/new",
            views.new_node_link,
            name="new-node-link",
        ),
        url(
            r"^workflow/get-possible-linked-workflows/",
            views.get_possible_linked_workflows,
            name="get-possible-linked-workflows",
        ),
        url(
            r"^workflow/(?P<pk>[0-9]+)/$",
            views.WorkflowDetailView.as_view(),
            name="workflow-detail-view",
        ),
        url(
            r"^project/create/$",
            views.ProjectCreateView.as_view(),
            name="project-create",
        ),
        url(
            r"^project/(?P<pk>[0-9]+)/$",
            views.ProjectDetailView.as_view(),
            name="project-detail-view",
        ),
        url(
            r"^program/(?P<projectPk>[0-9]+)/create/$",
            views.ProgramCreateView.as_view(),
            name="program-create",
        ),
        url(
            r"^program/(?P<pk>[0-9]+)/$",
            views.ProgramDetailView.as_view(),
            name="program-detail-view",
        ),
        url(
            r"^program/(?P<pk>[0-9]+)/update/$",
            views.ProgramUpdateView.as_view(),
            name="program-update",
        ),
        url(
            r"^course/(?P<projectPk>[0-9]+)/create/$",
            views.CourseCreateView.as_view(),
            name="course-create",
        ),
        url(
            r"^course/(?P<pk>[0-9]+)/$",
            views.CourseDetailView.as_view(),
            name="course-detail-view",
        ),
        url(
            r"^course/(?P<pk>[0-9]+)/static/$",
            views.StaticCourseDetailView.as_view(),
            name="static-course-detail-view",
        ),
        url(
            r"^course/(?P<pk>[0-9]+)/student/$",
            views.StudentCourseDetailView.as_view(),
            name="student-course-detail-view",
        ),
        url(
            r"^course/(?P<pk>[0-9]+)/update/$",
            views.CourseUpdateView.as_view(),
            name="course-update",
        ),
        url(
            r"^activity/(?P<projectPk>[0-9]+)/create/$",
            views.ActivityCreateView.as_view(),
            name="activity-create",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/$",
            views.ActivityDetailView.as_view(),
            name="activity-detail-view",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/static/$",
            views.StaticActivityDetailView.as_view(),
            name="static-activity-detail-view",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/student/$",
            views.StudentActivityDetailView.as_view(),
            name="student-activity-detail-view",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/update/$",
            views.ActivityUpdateView.as_view(),
            name="activity-update",
        ),
        url(
            r"^activity/update-json",
            views.update_activity_json,
            name="update-activity-json",
        ),
        url(
            r"^course/update-json",
            views.update_course_json,
            name="update-course-json",
        ),
        url(
            r"^program/update-json",
            views.update_program_json,
            name="update-program-json",
        ),
        url(r"^activity/add-node", views.add_node, name="add-node"),
        url(
            r"^activity/add-strategy", views.add_strategy, name="add-strategy"
        ),
        url(
            r"^dialog-form/create",
            views.dialog_form_create,
            name="dialog-form-create",
        ),
        url(
            r"^dialog-form/update",
            views.dialog_form_update,
            name="dialog-form-update",
        ),
        url(
            r"^dialog-form/delete",
            views.dialog_form_delete,
            name="dialog-form-delete",
        ),
        url(
            r"^dialog-form/remove",
            views.dialog_form_remove,
            name="dialog-form-remove",
        ),
        url(
            r"^course/duplication",
            views.duplicate_course_ajax,
            name="course-duplication",
        ),
        url(
            r"^activity/duplication",
            views.duplicate_activity_ajax,
            name="activity-duplication",
        ),
        url(
            r"^node/switch-completion-status",
            views.switch_node_completion_status,
            name="switch-node-completion-status",
        ),
        url(
            r"^component/switch-completion-status",
            views.switch_component_completion_status,
            name="switch-component-completion-status",
        ),
        url(
            r"^node/get-completion-status",
            views.get_node_completion_status,
            name="get-node-completion-status",
        ),
        url(
            r"^node/get-completion-count",
            views.get_node_completion_count,
            name="get-node-completion-count",
        ),
    ] + router.urls


def lti_patterns():
    return [path("course-list/", lti.get_course_list, name="course-list")]


urlpatterns = sum(
    [
        [path("lti/", include("django_lti_tool_provider.urls"))],
        flow_patterns(),
        lti_patterns(),
    ],
    [],
)
