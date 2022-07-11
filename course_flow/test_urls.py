from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

from . import lti, settings, urls, views

app_name = "course_flow"

if settings.DEBUG:
    import debug_toolbar


def auth_patterns():
    return [
        path("register/", views.registration_view, name="registration"),
        path(
            "login/",
            auth_views.LoginView.as_view(
                template_name="course_flow/registration/login.html"
            ),
            name="login",
        ),
        path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    ]


def lti_patterns():
    return [
        path("lti/", include("django_lti_tool_provider.urls")),
        path("course-list/", lti.get_course_list, name="course-list"),
    ]


def app_patterns():
    patterns = [
        path(
            "",
            include(
                (urls.urlpatterns + lti_patterns(), urls.app_name),
                namespace="course_flow",
            ),
        ),
        path(
            "feedback/",
            include("user_feedback.urls", namespace="user_feedback"),
        ),
        path("admin/", admin.site.urls),
    ]
    if settings.DEBUG:
        patterns += [path("__debug__/", include(debug_toolbar.urls))]
    return patterns


urlpatterns = sum([auth_patterns(), app_patterns(),], [],)
