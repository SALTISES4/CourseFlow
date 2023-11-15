from django.urls import reverse
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.contrib.auth.decorators import login_required
from django.contrib.humanize.templatetags import humanize
from course_flow.templatetags.course_flow_templatetags import (
    course_flow_return_url,
    course_flow_return_title,
    course_flow_password_change_url,
    has_group
)

@login_required
def json_api_get_top_bar(request: HttpRequest) -> JsonResponse:
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
                kwargs={ "pk": notification.content_object.pk }
            )
        else:
            url = reverse(
                "course_flow:workflow-update",
                kwargs={ "pk": notification.content_object.pk }
            )

        prepared_notifications.append({
            "unread": notification.is_unread,
            "url": url,
            "date": humanize.naturaltime(notification.created_on),
            "text": notification.text,
        })

    return JsonResponse({
        "isTeacher": has_group(user, "Teacher"),
        "notifications": {
            "url": reverse("course_flow:user-notifications"),
            "unread": unread,
            "items": prepared_notifications,
        },
        "menus": {
            "add": {
                "projectUrl": reverse("course_flow:project-create"),
            },
            "account": {
                "profileUrl": reverse("course_flow:user-update"),
                "resetPasswordUrl": course_flow_password_change_url(),
                "daliteUrl": course_flow_return_url(),
                "daliteText": course_flow_return_title(),
            }
        }
    })
