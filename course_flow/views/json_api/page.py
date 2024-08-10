"""
@todo what is this file doing
"""
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.http import HttpRequest, JsonResponse

from course_flow.models.discipline import Discipline
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.project import Project
from course_flow.models.workflow import Workflow
from course_flow.serializers import DisciplineSerializer, InfoBoxSerializer
from course_flow.templatetags.course_flow_templatetags import has_group
from course_flow.views.json_api.search import get_explore_objects


@login_required
def json_api__page__home(request: HttpRequest) -> JsonResponse:
    user = request.user
    templates_serialized = []

    if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
        projects_serialized = []
    else:
        projects = [
            op.content_object
            for op in ObjectPermission.objects.filter(
                project__deleted=False, user=user
            ).order_by("-last_viewed")[:2]
        ]
        templates = list(
            Project.objects.filter(
                deleted=False, published=True, is_template=True
            )
        ) + list(
            Workflow.objects.filter(
                deleted=False, published=True, is_template=True
            )
        )
        projects_serialized = InfoBoxSerializer(
            projects, many=True, context={"user": user}
        ).data
        templates_serialized = InfoBoxSerializer(
            templates, many=True, context={"user": user}
        ).data

    data = {
        "isTeacher": has_group(user, "Teacher"),
        "projects": projects_serialized,
        "templates": templates_serialized,
    }
    return JsonResponse({"action": "get", "data": data})


@login_required
def json_api__page__explore(request: HttpRequest) -> JsonResponse:
    user = request.user
    initial_workflows, pages = get_explore_objects(
        user,
        "",
        20,
        True,
        {"sort": "created_on", "sort_reversed": True},
    )

    data = {
        "initial_workflows": (
            InfoBoxSerializer(
                initial_workflows,
                context={"user": user},
                many=True,
            ).data
        ),
        "initial_pages": pages,
        "disciplines": DisciplineSerializer(
            Discipline.objects.all(), many=True
        ).data,
        "user_id": user.id
        if user
        else 0,  # @todo this should handle null not 0, or perhaps -1
    }
    return JsonResponse({"action": "get", "data": data})
