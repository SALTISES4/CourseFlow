#########################################################
# Aggregated URLS
#
# pull in URLs from
# -- json api
# -- html renders
# -- admin etc
# and pass them to the django router
#########################################################
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework import routers

from course_flow import settings, views
from course_flow.routes import html_urls, json_api_urls

router = routers.SimpleRouter()

app_name = "course_flow"

if settings.DEBUG:
    import debug_toolbar


def auth_patterns():
    return [
        path("register/", views.registration_view, name="registration"),
        path(
            "login/",
            auth_views.LoginView.as_view(
                template_name="course_flow/html/registration/registration.html"
            ),
            name="login",
        ),
        path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    ]


def app_patterns():
    patterns = [
        path(
            "course-flow/",
            include(
                (html_urls.patterns, app_name),
                namespace="course_flow",
            ),
        ),
        path(
            "course-flow/",
            include(
                (router.urls, app_name),
                namespace="course_flow",
            ),
        ),
        path(
            "course-flow/json-api/v1/",
            include(
                (json_api_urls.patterns, app_name),
                namespace="json_api",
            ),
        ),
        path("admin/", admin.site.urls),
    ]
    if settings.DEBUG:
        patterns += [path("__debug__/", include(debug_toolbar.urls))]
    return patterns


urlpatterns = sum(
    [auth_patterns(), app_patterns()],
    [],
)
