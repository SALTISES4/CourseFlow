from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.urls import reverse
from django.contrib.humanize.templatetags import humanize

from course_flow.decorators import ajax_login_required
from course_flow.forms import ProfileSettings
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.serializers import (
    FormFieldsSerializer,
    UserSerializer
)
from rest_framework.renderers import JSONRenderer


@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))


@login_required
def notifications_view(request):
    user = request.user

    # get total count of unread notifications
    unread = user.notifications.filter(is_unread=True).count()

    # prepare notification data to be consumed by the frontend
    prepared_notifications = []
    for notification in user.notifications.all():
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

        prepared_notifications.append(
            {
                "id": notification.id,
                "unread": notification.is_unread,
                "url": url,
                # TODO: Update notification text to omit the user's name
                # since now it's a separate 'from' field
                "date": humanize.naturaltime(notification.created_on),
                "text": notification.text,
                "from": f"{source_user['first_name']} {source_user['last_name']}",
            }
        )


    context = {
        "title": "Notifications",
        "path_id": "notifications",
        "contextData": JSONRenderer().render(
            {
                "notifications": prepared_notifications,
                "unreadCount": unread,
            }
        ).decode("utf-8"),
    }
    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
def notifications_settings_view(request):
    user = CourseFlowUser.objects.filter(user=request.user).first()
    context = {
        "title": "Notifications Settings",
        "path_id": "notificationsSettings",
        "contextData": JSONRenderer().render(
            {"formData": {"receiveNotifications": user.notifications}}
        ).decode("utf-8"),
    }
    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
def profile_settings_view(request):
    user = CourseFlowUser.objects.filter(user=request.user).first()
    form = ProfileSettings(
        {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "language": user.language,
        }
    )

    context = {
        "title": "Profile Settings",
        "path_id": "profileSettings",
        "contextData": JSONRenderer().render(
            {"formData": FormFieldsSerializer(form).prepare_fields()}
        ).decode("utf-8"),
    }

    return render(request, "course_flow/react/common_entrypoint.html", context)
