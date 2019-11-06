from django.conf.urls import include, url


from . import views


def flow_patterns():
    return [
        url(
            r"^course/(?P<pk>[0-9]+)/$",
            views.CourseDetailView.as_view(),
            name="course-detail",
        ),
        url(
            r"^course/(?P<pk>[0-9]+)/update/$",
            views.CourseUpdateView.as_view(),
            name="course-update",
        ),
        url(
            r"^course/(?P<pk>[0-9]+)/delete/$",
            views.CourseDeleteView.as_view(),
            name="course-delete",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/$",
            views.ActivityDetailView.as_view(),
            name="activity-detail",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/update/$",
            views.ActivityUpdateView.as_view(),
            name="activity-update",
        ),
        url(
            r"^activity/(?P<pk>[0-9]+)/delete/$",
            views.ActivityDeleteView.as_view(),
            name="activity-delete",
        ),
        url(
            r"^activity/update-json",
            views.update_strategy_json,
            name="update-strategy-json",
        ),
    ]


urlpatterns = sum([flow_patterns()], [])
