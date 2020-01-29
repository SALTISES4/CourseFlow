from django.conf.urls import url
from django.contrib.auth import views as auth_views
from django.urls import path
from rest_framework import routers

from . import lti, views

router = routers.SimpleRouter()
router.register(r"activity/read", views.ActivityViewSet)
router.register(r"course/read", views.CourseViewSet)
router.register(r"program/read", views.ProgramViewSet)


def flow_patterns():
    return [
        url(r"^register/$", views.registration_view, name="registration"),
        url(
            r"^login/$",
            auth_views.LoginView.as_view(),
            {"template_name": "registration/login.html"},
            name="course-flow-login",
        ),
        url(
            r"^logout/$",
            auth_views.LogoutView.as_view(),
            name="course-flow-logout",
        ),
        url(r"home/$", views.home_view, name="course-flow-home"),
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
    ] + router.urls


def lti_patterns():
    return [path("course-list/", lti.get_course_list, name="course-list")]


urlpatterns = sum([flow_patterns(), lti_patterns()], [])
