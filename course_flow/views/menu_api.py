import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.contrib.humanize.templatetags import humanize
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from django.urls import reverse

from course_flow.decorators import ajax_login_required, public_access
from course_flow.models import (
    CourseFlowUser,
    Favourite,
    LiveProject,
    ObjectPermission,
    Project,
    Workflow,
)
from course_flow.serializers import (
    FavouriteSerializer,
    InfoBoxSerializer,
    LiveProjectSerializer,
)
from course_flow.templatetags.course_flow_templatetags import (
    course_flow_password_change_url,
    course_flow_return_title,
    course_flow_return_url,
    has_group,
)
from course_flow.utils import get_nondeleted_favourites


@public_access()
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


@public_access()
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


@login_required
def json_api_get_home(request: HttpRequest) -> JsonResponse:
    user = request.user
    if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
        projects = LiveProject.objects.filter(
            project__deleted=False,
            liveprojectuser__user=user,
        )
        projects_serialized = LiveProjectSerializer(
            projects, many=True, context={"user": user}
        ).data
        favourites_serialized = []
    else:
        projects = [
            op.content_object
            for op in ObjectPermission.objects.filter(
                project__deleted=False, user=user
            ).order_by("-last_viewed")[:2]
        ]
        projects_serialized = InfoBoxSerializer(
            projects, many=True, context={"user": user}
        ).data
        favourites = [
            fav.content_object
            for fav in Favourite.objects.filter(user=user).filter(
                Q(workflow__deleted=False, workflow__project__deleted=False)
                | Q(project__deleted=False)
                | Q(workflow__deleted=False, workflow__is_strategy=True)
            )
        ]
        favourites_serialized = InfoBoxSerializer(
            favourites, many=True, context={"user": user}
        ).data
    return JsonResponse(
        {"projects": projects_serialized, "favourites": favourites_serialized}
    )


@login_required
def json_api_get_library(request: HttpRequest) -> JsonResponse:
    user = request.user
    all_projects = list(Project.objects.filter(user_permissions__user=user))
    all_projects += list(
        Workflow.objects.filter(user_permissions__user=user, is_strategy=True)
    )
    projects_serialized = InfoBoxSerializer(
        all_projects, many=True, context={"user": user}
    ).data
    return JsonResponse({"data_package": projects_serialized})


@login_required
def json_api_get_favourites(request: HttpRequest) -> JsonResponse:
    projects_serialized = InfoBoxSerializer(
        get_nondeleted_favourites(request.user),
        many=True,
        context={"user": request.user},
    ).data
    return JsonResponse({"data_package": projects_serialized})


# Used to change whether or not the user receives notifications
@ajax_login_required
def json_api_post_select_notifications(request: HttpRequest) -> JsonResponse:
    notifications = json.loads(request.POST.get("notifications"))
    try:
        courseflowuser = CourseFlowUser.ensure_user(request.user)
        courseflowuser.notifications = notifications
        courseflowuser.notifications_active = True
        courseflowuser.save()
    except ObjectDoesNotExist:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})
