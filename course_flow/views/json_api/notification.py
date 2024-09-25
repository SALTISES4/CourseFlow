import json

from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, JsonResponse
from rest_framework.decorators import api_view

from course_flow.services.notifications import get_user_notifications


class NotificationEndPoint:
    #########################################################
    # USER NOTIFICATION
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def list(request: HttpRequest):
        user = request.user

        unread_count, prepared_notifications = get_user_notifications(user)

        data = {
            "items": prepared_notifications,
            "meta": {"unread_count": unread_count},
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
            return JsonResponse({"message": "success"})

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

        return JsonResponse({"message": "success"})

    #########################################################
    # APP NOTIFICATION
    #########################################################
