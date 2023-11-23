from django.contrib.auth.decorators import login_required
from django.contrib.humanize.templatetags import humanize
from django.db.models import Q
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.urls import reverse

from course_flow.serializers import FavouriteSerializer
from course_flow.templatetags.course_flow_templatetags import (
    course_flow_password_change_url,
    course_flow_return_title,
    course_flow_return_url,
    has_group,
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
                kwargs={"pk": notification.content_object.pk},
            )
        else:
            url = reverse(
                "course_flow:workflow-update",
                kwargs={"pk": notification.content_object.pk},
            )

        prepared_notifications.append(
            {
                "unread": notification.is_unread,
                "url": url,
                "date": humanize.naturaltime(notification.created_on),
                "text": notification.text,
            }
        )

    return JsonResponse(
        {
            "is_teacher": has_group(user, "Teacher"),
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
                },
            },
        }
    )


@login_required
def json_api_get_sidebar(request: HttpRequest) -> JsonResponse:
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

    return JsonResponse(
        {
            "is_teacher": has_group(user, "Teacher"),
            "is_anonymous": user.is_anonymous,
            "favourites": favourites,
        }
    )
