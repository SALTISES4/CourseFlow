import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_POST

from course_flow.decorators import user_can_view, user_is_teacher
from course_flow.forms import NotificationsSettings, ProfileSettings
from course_flow.models import User
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.favourite import Favourite
from course_flow.serializers import UserSerializer
from course_flow.utils import get_model_from_str


@login_required
@require_POST
def json_api__user__profile_settings__update__post(
    request: HttpRequest,
) -> JsonResponse:
    user = CourseFlowUser.objects.filter(user=request.user).first()
    # instantiate the form with the JSON params and the model instance
    form = ProfileSettings(json.loads(request.body), instance=user)

    # if the form is valid, save it and return a success response
    if form.is_valid():
        form.save()
        return JsonResponse({"action": "posted"})

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


@login_required
@require_POST
def json_api__user__notification_settings__post(
    request: HttpRequest,
) -> JsonResponse:
    user = CourseFlowUser.objects.filter(user=request.user).first()
    # on POST, instantiate the form with the JSON params and the model instance
    form = NotificationsSettings(json.loads(request.body), instance=user)

    # if the form is valid, save it and return a success response
    if form.is_valid():
        form.save()
        return JsonResponse({"action": "posted"})

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


# favourite/unfavourite a project or workflow for a user
@user_can_view(False)
def json_api__favourite__toggle__post(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    object_id = body.get("objectID")
    objectType = body.get("objectType")
    favourite = body.get("favourite")
    response = {}
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    try:
        item = get_model_from_str(objectType).objects.get(pk=object_id)
        Favourite.objects.filter(
            user=request.user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if favourite:
            Favourite.objects.create(user=request.user, content_object=item)
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"

    return JsonResponse(response)


@user_is_teacher()
def json_api__user__list__post(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    name_filter = body.get("filter")
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
