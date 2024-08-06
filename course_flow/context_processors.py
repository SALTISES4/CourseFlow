from django.conf import settings
from django.contrib.auth.models import Group
from rest_framework.renderers import JSONRenderer

from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.updateNotification import UpdateNotification
from course_flow.serializers import UpdateNotificationSerializer


def update_notifications(request):
    try:
        if "course_flow" in request.resolver_match.namespace:
            last_update = UpdateNotification.objects.last()
            if last_update is not None:
                last_update_serialized = (
                    JSONRenderer()
                    .render(UpdateNotificationSerializer(last_update).data)
                    .decode("utf-8")
                )
                if (
                    Group.objects.get(name=settings.TEACHER_GROUP)
                    in request.user.groups.all()
                ):
                    courseflow_user = CourseFlowUser.ensure_user(request.user)
                    show_notification_request = (
                        not courseflow_user.notifications_active
                    )
                else:
                    show_notification_request = False
                return {
                    "update_notifications": last_update_serialized,
                    "show_notification_request": JSONRenderer()
                    .render(show_notification_request)
                    .decode("utf-8"),
                }
    except Exception:
        pass
    return {
        "update_notifications": {},
        "show_notification_request": JSONRenderer()
        .render(False)
        .decode("utf-8"),
    }
