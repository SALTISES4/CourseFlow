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
        # Library, may not be the best namespace
        # but we'll keep it for now
        # general collectoin of different views for user to see
        # items which belong to them or they can explore
        #########################################################
        path(
            "home/",
            views.html.library.default_react_view,
            {
                "title": "Home",
                "path_id": "home",
            },
            name="home",
        ),
        path(
            "library/",
            views.html.library.default_react_view,
            {
                "title": "My Library",
                "path_id": "library",
            },
            name="library",
        ),
        path(
            "favourites/",
            views.html.library.default_react_view,
            {
                "title": "My Favourites",
                "path_id": "favourites",
            },
            name="favourites",
        ),
        path("explore/", views.html.library.explore_view, name="explore"),
        #########################################################
        # USER
        #########################################################
        path(
            "user/profile-settings/",
            views.html.library.default_react_view,
            {
                "title": "Profile Settings",
                "path_id": "profileSettings",
            },
            name="user-update",
        ),
        path(
            "user/notifications-settings/",
            views.html.library.default_react_view,
            {
                "title": "Notifications Settings",
                "path_id": "notificationsSettings",
            },
            name="user-notifications-settings",
        ),
        path(
            "user/notifications/",
            views.html.library.default_react_view,
            {
                "title": "Notifications",
                "path_id": "notifications",
            },
            name="user-notifications",
        ),
        #########################################################
        # WORKFLOW
        #########################################################
        path(
            "workflow/<int:pk>/",
            views.html.library.default_react_view,
            {
                "title": "Project",
                "path_id": "workflowDetail",
            },
            name="workflow-detail",
        ),
        path(
            "workflow/public/<int:pk>/",
            ratelimit(key="ip", method=["GET"], rate="5/m", block=True)(
                views.WorkflowPublicDetailView.as_view()
            ),
            name="workflow-public",
        ),
        #########################################################
        # PROJECT
        #########################################################
        path(
            "project/<path:pk>/",
            views.html.library.default_react_view,
            {
                "title": "Project",
                "path_id": "projectDetail",
            },
            name="project-detail",
        ),
        path(
            "project/<int:pk>/comparison",
            views.ProjectComparisonView.as_view(),
            name="project-comparison",
        ),
        #########################################################
        # PROGRAM
        #########################################################
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
        #########################################################
        # ACTIVITY
        #########################################################
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
        #########################################################
        # ADMIN
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
        #########################################################
        # UTILITY
        #########################################################
        path(
            "styleguide/",
            views.html.utility.styleguide_home_view,
            name="styleguide",
        ),
        # todo is this for dev only or this is the same path for dalite embed?
        path("logout/", views.logout_view, name="logout"),
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
