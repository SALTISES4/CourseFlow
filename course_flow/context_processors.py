from django.conf import settings
from django.contrib.auth.models import Group
from rest_framework.renderers import JSONRenderer
from django.contrib.humanize.templatetags import humanize
from django.http import HttpRequest
from django.urls import reverse
from django.db.models import Q

from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.updateNotification import UpdateNotification
from course_flow.serializers import (
    FavouriteSerializer,
    UpdateNotificationSerializer,
    UserSerializer,
)

from course_flow.forms import CreateProject
from course_flow.serializers import FormFieldsSerializer

from course_flow.templatetags.course_flow_templatetags import (
    course_flow_password_change_url,
    course_flow_return_title,
    course_flow_return_url,
    has_group,
)


def add_global_context(request: HttpRequest):
    return {
        "globalContextData": JSONRenderer().render({
            "sidebar": get_sidebar(request),
            "topbar": get_topbar(request),
            "notifications": get_update_notifications(request)
        }).decode("utf-8")
    }


def get_sidebar(request: HttpRequest):
    try:
        user = request.user

        # Prepare 5 most recent favourites, using a serializer that will give just the url and name
        favourites = FavouriteSerializer(
            [
                x.content_object
                for x in user.favourite_set.filter(
                    Q(workflow__deleted=False, workflow__project__deleted=False)
                    | Q(project__deleted=False)
                )[:5]
            ],
            many=True,
            context={"user": user},
        ).data

        return {
            "isTeacher": has_group(user, "Teacher"),
            "isAnonymous": user.is_anonymous,
            "favourites": favourites,
        }
    except Exception:
        pass

    return {}


def get_topbar(request: HttpRequest):
    try:
        user = request.user

        # get total count of unread notifications
        unread = user.notifications.filter(is_unread=True).count()

        # prepare notification data to be consumed by the frontend
        # show the recent 7 notifications
        prepared_notifications = []
        for notification in user.notifications.all()[:7]:
            if notification.content_object.type == "project":
                url = reverse(
                    "course_flow:project-update",
                    kwargs={"pk": notification.content_object.pk},
                )
            else:
                url = reverse(
                    "course_flow:workflow-update",
                    kwargs={"pk": notification.content_object.pk},
                )

            source_user = UserSerializer(notification.source_user).data
            source_user_name = source_user['username']
            if (source_user['first_name']):
                source_user_name = source_user['first_name']

            if (source_user['first_name'] and source_user['last_name']):
                source_user_name = f"{source_user['first_name']} {source_user['last_name']}"

            prepared_notifications.append(
                {
                    "id": notification.id,
                    "unread": notification.is_unread,
                    "url": url,
                    "date": humanize.naturaltime(notification.created_on),
                    "text": notification.text,
                    "from": source_user_name,
                }
            )

        form = CreateProject(
            {
                "title": "New project name",
                "description": "",
                # TODO: Add object sets and discipline fields
            }
        )

        return {
            "isTeacher": has_group(user, "Teacher"),
            "notifications": {
                "url": reverse("course_flow:user-notifications"),
                "unread": unread,
                "items": prepared_notifications,
            },
            "forms": {
                "createProject": {
                    # TODO: count the number of current user's projects
                    "showNoProjectsAlert": True,
                    "formFields": FormFieldsSerializer(form).prepare_fields()
                }
            },
            "menus": {
                "add": {
                    "projectUrl": reverse("course_flow:project-create"),
                },
                "account": {
                    "notificationsSettingsUrls": reverse(
                        "course_flow:user-notifications-settings"
                    ),
                    "profileUrl": reverse("course_flow:user-update"),
                    "resetPasswordUrl": course_flow_password_change_url(),
                    "daliteUrl": course_flow_return_url(),
                    "daliteText": course_flow_return_title(),
                },
            },
        }
    except Exception:
        pass

    return {}


def get_update_notifications(request: HttpRequest):
    try:
        if "course_flow" in request.resolver_match.namespace:
            last_update = UpdateNotification.objects.last()
            if last_update is not None:
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
                    "updateNotifications": UpdateNotificationSerializer(last_update).data,
                    "showNotificationRequest": show_notification_request,
                }
    except Exception:
        pass
    return {
        "updateNotifications": {},
        "showNotificationRequest": False,
    }
