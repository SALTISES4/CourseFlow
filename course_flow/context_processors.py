from django.conf import settings
from django.contrib.auth.models import Group
from rest_framework.renderers import JSONRenderer

from course_flow.models import CourseFlowUser, UpdateNotification
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
                    courseflow_user = CourseFlowUser.objects.filter(
                        user=request.user
                    ).first()
                    if courseflow_user is None:
                        print("create the user")
                        courseflow_user = CourseFlowUser.objects.create(
                            first_name=request.user.first_name,
                            last_name=request.user.last_name,
                            user=request.user,
                        )
                    print("in this")
                    show_notification_request = (
                        not courseflow_user.notifications_active
                    )
                else:
                    show_notification_request = False
                print(show_notification_request)
                return {
                    "update_notifications": last_update_serialized,
                    "show_notification_request": JSONRenderer()
                    .render(show_notification_request)
                    .decode("utf-8"),
                }
    except Exception:
        print("exception")
        pass
    return {
        "update_notifications": {},
        "show_notification_request": JSONRenderer()
        .render(False)
        .decode("utf-8"),
    }
