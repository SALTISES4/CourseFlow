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
        # PAGES
        #########################################################
        #  Page: Styleguide
        #  React component styleguide / dumb components preview page
        path(
            "styleguide/", views.html.pages.styleguide_home, name="styleguide"
        ),
        path("home/", views.html.pages.home_view, name="home"),
        path("explore/", views.html.pages.explore_view, name="explore"),
        path(
            "favourites/", views.html.pages.favourites_view, name="favourites"
        ),
        path("library/", views.html.pages.library_view, name="library"),
        #########################################################
        # WORKFLOW
        #########################################################
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
        #########################################################
        # PROJECT
        #########################################################
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
            "project/get-disciplines/",
            views.DisciplineListView.as_view(),
            name="get-disciplines",
        ),
        #########################################################
        # USER
        #########################################################
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
        # todo is this for dev only or this is the same path for dalite embed?
        path("logout/", views.logout_view, name="logout"),
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
