from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.humanize.templatetags import humanize

from course_flow.models import UpdateNotification, User
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.serializers import (
    UpdateNotificationSerializer,
    UserSerializer,
)


def get_user_notifications(user):
    """
    # prepare notification data to be consumed by the frontend
    # optionally limit
    # get total count of unread notifications

    :param user:
    :return:
    """
    unread_count = user.notifications.filter(is_unread=True).count()

    # prepare notification data to be consumed by the frontend
    prepared_notifications = []
    for notification in user.notifications.all():
        source_user = UserSerializer(notification.source_user).data
        source_user_name = source_user["username"]
        if source_user["first_name"]:
            source_user_name = source_user["first_name"]

        if source_user["first_name"] and source_user["last_name"]:
            source_user_name = (
                f"{source_user['first_name']} {source_user['last_name']}"
            )

        prepared_notifications.append(
            {
                "id": notification.id,
                "type": notification.content_object.type,
                "unread": notification.is_unread,
                "date": humanize.naturaltime(notification.created_on),
                "text": notification.text,
                "from": source_user_name,
            }
        )

    return unread_count, prepared_notifications


def get_app_update_notifications(user: User):
    """
    global updates for whole app, this currently serves no purpose
    not used in frontend but there is a model for it so verify before purging
    :param user:
    :param request:
    :return:
    """
    last_update = UpdateNotification.objects.last()

    if last_update is not None:
        if Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all():
            courseflow_user = CourseFlowUser.ensure_user(user)
            show_notification_request = (
                not courseflow_user.notifications_active
            )

        else:
            show_notification_request = False

        return {
            "updateNotifications": UpdateNotificationSerializer(
                last_update
            ).data,
            "showNotificationRequest": show_notification_request,
        }

    return {"updateNotifications": [], "showNotificationRequest": False}
