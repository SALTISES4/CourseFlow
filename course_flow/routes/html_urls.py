#########################################################
# Define All HTML Routes
#########################################################
from django.urls import path
from django.views.i18n import JavaScriptCatalog
from ratelimit.decorators import ratelimit

from course_flow import views


def html_patterns():
    return [
        #########################################################
        # Library
        #########################################################
        path(
            "home/",
            views.html.client.default_react_view,
            name="home",
        ),
        path(
            "library/",
            views.html.client.default_react_view,
            name="library",
        ),
        path(
            "favourites/",
            views.html.client.default_react_view,
            name="favourites",
        ),
        path(
            "explore/",
            views.html.client.default_react_view,
            name="explore",
        ),
        #########################################################
        # USER
        #########################################################
        path(
            "user/profile-settings/",
            views.html.client.default_react_view,
            name="user-update",
        ),
        path(
            "user/notifications-settings/",
            views.html.client.default_react_view,
            name="user-notifications-settings",
        ),
        path(
            "user/notifications/",
            views.html.client.default_react_view,
            name="user-notifications",
        ),
        #########################################################
        # WORKFLOW
        #########################################################
        path(
            "workflow/<int:pk>/",
            views.html.client.default_react_view,
            name="workflow-detail",
        ),
        path(
            "workflow/<int:pk>/<path:rest_of_path>",
            views.html.client.default_react_view,
            name="workflow-tabs",
        ),
        path(
            "workflow/public/<int:pk>/",
            ratelimit(key="ip", method=["GET"], rate="5/m", block=True)(
                views.html.client.default_react_view,
            ),
            name="workflow-public",
        ),
        #########################################################
        # PROJECT
        #########################################################
        path(
            "project/<path:pk>/",
            views.html.client.default_react_view,
            name="project-detail",
        ),
        path(
            "project/<int:pk>/comparison",
            views.html.client.default_react_view,
            name="project-comparison",
        ),
        # TEMP
        path(
            "temp-project",
            views.html.client.default_react_view,
            name="temp-project",
        ),
        #########################################################
        # ADMIN / AUTH
        #########################################################
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
        #########################################################
        # UTILITY / DEV
        #########################################################
        path(
            "styleguide/<path:rest_of_path>",
            views.html.client.default_react_view,
            name="styleguide",
        ),
        # todo is this for dev only or this is the same path for dalite embed?
        path("import/", views.import_view, name="import"),
        path(
            "downloads/saltise/get/",
            views.get_saltise_download,
            name="get-saltise-download",
        ),
        path(
            "jsi18n/", JavaScriptCatalog.as_view(), name="javascript-catalog"
        ),
    ]


patterns = html_patterns()
