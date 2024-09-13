import json

from django.contrib.auth.decorators import login_required
from django.contrib.humanize.templatetags import humanize
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.serializers import UserSerializer


class NotificationEndPoint:
    @staticmethod
    @login_required
    @api_view(["GET"])
    def list(request: HttpRequest):
        user = request.user

        # get total count of unread notifications
        unread = user.notifications.filter(is_unread=True).count()

        # prepare notification data to be consumed by the frontend
        prepared_notifications = []
        for notification in user.notifications.all():
            if notification.content_object.type == "project":
                url = reverse(
                    "course_flow:project-detail",
                    kwargs={"pk": notification.content_object.pk},
                )
            else:
                url = reverse(
                    "course_flow:workflow-detail",
                    kwargs={"pk": notification.content_object.pk},
                )

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
                    "unread": notification.is_unread,
                    "url": url,
                    "date": humanize.naturaltime(notification.created_on),
                    "text": notification.text,
                    "from": source_user_name,
                }
            )

        data = {
            "notifications": prepared_notifications,
            "unreadCount": unread,
        }
        return JsonResponse({"action": "get", "data_package": data})

    @staticmethod
    @login_required
    @api_view(["POST"])
    def delete(request: HttpRequest):
        post_data = json.loads(request.body)
        if "notification_id" in post_data:
            notification_id = post_data["notification_id"]
            request.user.notifications.filter(id=notification_id).delete()
            return JsonResponse({"action": "posted"})

        return JsonResponse({"action": "error"})

    @staticmethod
    @login_required
    @api_view(["POST"])
    def mark_all_as_read(request):
        post_data = json.loads(request.body)

        if "notification_id" in post_data:
            # if a notification_id is passed as post data
            # then we're updating that specific notification object
            notification_id = post_data["notification_id"]
            request.user.notifications.filter(id=notification_id).update(
                is_unread=False
            )
        else:
            # otherwise, we're updating all the notifications to be read
            request.user.notifications.filter(is_unread=True).update(
                is_unread=False
            )

        return JsonResponse({"action": "posted"})
