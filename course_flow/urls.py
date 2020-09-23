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
            r"^workflow/(?P<pk>[0-9]+)/update/$",
            views.WorkflowUpdateView.as_view(),
            name="workflow-update",
        ),
        url(
            r"^workflow/(?P<pk>[0-9]+)/$",
            views.WorkflowDetailView.as_view(),
            name="workflow-detail-view",
        ),
        url(
            r"^program/create/$",
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
            r"^course/create/$",
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
            r"^activity/create/$",
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
            r"^course/add-component",
            views.add_component_to_course,
            name="add-component-to-course",
        ),
        url(
            r"^program/add-component",
            views.add_component_to_program,
            name="add-component-to-program",
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
            r"^component/get-completion-status",
            views.get_component_completion_status,
            name="get-component-completion-status",
        ),
        url(
            r"^node/get-completion-count",
            views.get_node_completion_count,
            name="get-node-completion-count",
        ),
        url(
            r"^component/get-completion-count",
            views.get_component_completion_count,
            name="get-component-completion-count",
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
