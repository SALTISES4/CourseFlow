import json

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpRequest, JsonResponse

from course_flow.decorators import ajax_login_required
from course_flow.models import Project
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.workflow import Workflow
from course_flow.serializers import InfoBoxSerializer
from course_flow.utils import get_nondeleted_favourites


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


# Used to change whether the user receives notifications
@ajax_login_required
def json_api_post_select_notifications(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    notifications = body.get("notifications")
    try:
        courseflowuser = CourseFlowUser.ensure_user(request.user)
        courseflowuser.notifications = notifications
        courseflowuser.notifications_active = True
        courseflowuser.save()
    except ObjectDoesNotExist:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})
