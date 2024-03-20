import json

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.humanize.templatetags import humanize
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from course_flow.decorators import (
    ajax_login_required,
    user_can_edit,
    user_can_view,
    user_is_teacher,
)
from course_flow.models import User
from course_flow.models.notification import Notification
from course_flow.models.objectPermission import ObjectPermission
from course_flow.serializers import UserSerializer
from course_flow.utils import get_model_from_str, make_user_notification

# import time


#####################################################
# JSON API for all things sharing and notifications
#####################################################


# change permissions on an object for a user
@user_can_edit(False)
def json_api_post_set_permission(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    objectType = json.loads(request.POST.get("objectType"))
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    user_id = json.loads(request.POST.get("permission_user"))
    permission_type = json.loads(request.POST.get("permission_type"))
    response = {}
    try:
        user = User.objects.get(id=user_id)
        if (
            permission_type
            in [
                ObjectPermission.PERMISSION_EDIT,
                ObjectPermission.PERMISSION_VIEW,
                ObjectPermission.PERMISSION_COMMENT,
            ]
            and Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
            return JsonResponse(
                {"action": "error", "error": _("User is not a teacher.")}
            )
        item = get_model_from_str(objectType).objects.get(id=object_id)
        # if hasattr(item, "get_subclass"):
        #     item = item.get_subclass()

        project = item.get_project()
        if permission_type != ObjectPermission.PERMISSION_EDIT:
            if item.author == user or (
                project is not None and project.author == user
            ):
                response = JsonResponse(
                    {
                        "action": "error",
                        "error": _("This user's role cannot be changed."),
                    }
                )
                # response.status_code = 403
                return response

        # Not currently enabled
        if permission_type == ObjectPermission.PERMISSION_STUDENT:
            raise ValidationError

        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if permission_type != ObjectPermission.PERMISSION_NONE:
            ObjectPermission.objects.create(
                user=user, content_object=item, permission_type=permission_type
            )
            make_user_notification(
                source_user=request.user,
                target_user=user,
                notification_type=Notification.TYPE_SHARED,
                content_object=item,
            )
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"

    return JsonResponse(response)


@user_can_view(False)
def json_api_post_get_users_for_object(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    if object_type in ["activity", "course", "program"]:
        object_type = "workflow"
    content_type = ContentType.objects.get(model=object_type)
    this_object = get_model_from_str(object_type).objects.get(id=object_id)
    published = this_object.published
    public_view = False
    if object_type == "workflow":
        public_view = this_object.public_view
    try:
        this_object = get_model_from_str(object_type).objects.get(id=object_id)
        cannot_change = []
        if this_object.author is not None:
            cannot_change = [this_object.author.id]
            author = UserSerializer(this_object.author).data
            if object_type == "workflow" and not this_object.is_strategy:
                cannot_change.append(this_object.get_project().author.id)
        else:
            author = None
        editors = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        ).select_related("user"):
            editors.add(object_permission.user)
        viewers = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        ).select_related("user"):
            viewers.add(object_permission.user)
        commentors = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_COMMENT,
        ).select_related("user"):
            commentors.add(object_permission.user)
        students = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_STUDENT,
        ).select_related("user"):
            students.add(object_permission.user)
        try:
            if (
                Group.objects.get(name="SALTISE_Staff")
                in request.user.groups.all()
            ):
                saltise_user = True
            else:
                saltise_user = False
        except ObjectDoesNotExist:
            saltise_user = False
        is_template = this_object.is_template
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "author": author,
            "viewers": UserSerializer(viewers, many=True).data,
            "commentors": UserSerializer(commentors, many=True).data,
            "editors": UserSerializer(editors, many=True).data,
            "students": UserSerializer(students, many=True).data,
            "published": published,
            "public_view": public_view,
            "cannot_change": cannot_change,
            "saltise_user": saltise_user,
            "is_template": is_template,
        }
    )


@user_is_teacher()
def json_api_post_get_user_list(request: HttpRequest) -> JsonResponse:
    name_filter = json.loads(request.POST.get("filter"))
    names = name_filter.split(" ")
    length = len(names)
    filters = [[name_filter, ""], ["", name_filter]]
    for i, name in enumerate(names):
        if i < length - 1:
            filters += [
                [" ".join(names[0 : i + 1]), " ".join(names[i + 1 : length])]
            ]
    try:
        q_objects = Q(username__istartswith=name_filter)
        for q_filter in filters:
            q_objects |= Q(
                first_name__istartswith=q_filter[0],
                last_name__istartswith=q_filter[1],
            )

        teacher_group = Group.objects.get(name=settings.TEACHER_GROUP)

        user_list = User.objects.filter(q_objects, groups=teacher_group)[:10]
        count = len(user_list)
        if count < 10:
            user_list = list(user_list)
            q_objects = Q(username__icontains=name_filter)
            for q_filter in filters:
                q_objects |= Q(
                    first_name__icontains=q_filter[0],
                    last_name__icontains=q_filter[1],
                )
            user_list += list(
                User.objects.filter(q_objects, groups=teacher_group).exclude(
                    id__in=[user.id for user in user_list]
                )[: 10 - count]
            )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "user_list": UserSerializer(user_list, many=True).data,
        }
    )


@ajax_login_required
@require_POST
def json_api_post_mark_all_notifications_as_read(request):
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


@ajax_login_required
@require_POST
def json_api_post_delete_notification(request):
    post_data = json.loads(request.body)
    if "notification_id" in post_data:
        notification_id = post_data["notification_id"]
        request.user.notifications.filter(id=notification_id).delete()
        return JsonResponse({"action": "posted"})

    return JsonResponse({"action": "error"})
