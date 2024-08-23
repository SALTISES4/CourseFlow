import json

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from course_flow.decorators import user_can_edit, user_can_view
from course_flow.duplication_functions import fast_duplicate_project
from course_flow.forms import CreateProject
from course_flow.models import Project
from course_flow.models.discipline import Discipline
from course_flow.serializers import (
    DisciplineSerializer,
    InfoBoxSerializer,
    ProjectSerializerShallow,
)
from course_flow.utils import get_user_permission
from course_flow.views import UserCanViewMixin


#########################################################
#
#########################################################
@permission_classes([UserCanViewMixin])
@api_view(["GET"])
@login_required
def json_api__project__detail__get(request):
    project_pk = request.GET.get("id")
    try:
        project = Project.objects.get(pk=project_pk)

    except Project.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    serializer = ProjectSerializerShallow(
        project, context={"request": request}
    )

    disciplines = DisciplineSerializer(
        Discipline.objects.order_by("title"), many=True
    ).data

    user_permission = get_user_permission(
        project, request.user
    )  # Adjust according to your permission logic

    response_data = {
        "user_id": request.user.id,
        "user_permission": user_permission,
        "project_data": serializer.data,
        "disciplines": disciplines,
        "create_path_this_project": get_project_urls_by_pk(project_pk),
    }

    return JsonResponse({"action": "GET", "data_package": response_data})


#########################################################
# CREATE
#########################################################
@login_required
@require_POST
def project__create__post(request: HttpRequest) -> JsonResponse:
    # instantiate the form with the JSON params
    data = json.loads(request.body)
    form = CreateProject(json.loads(request.body))

    # if the form is valid, save it and return a success response
    # along with the redirect URL to the newly created project
    if form.is_valid():
        project = form.save()
        project.author = request.user
        project.save()

        # Create the object sets, if any
        object_sets = data["objectSets"]
        for object_set in object_sets:
            title = "Untitled Set"
            if object_set["label"] is not None and object_set["label"] != "":
                title = object_set["label"]
            project.object_sets.create(term=object_set["type"], title=title)

        return JsonResponse(
            {
                "action": "posted",
                "redirect": reverse(
                    "course_flow:project-update", kwargs={"pk": project.pk}
                ),
            }
        )

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


#########################################################
# DUPLICATE
#########################################################
@user_can_view("projectPk")
def json_api_post_duplicate_project(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    project = Project.objects.get(pk=body.get("projectPk"))
    try:
        with transaction.atomic():
            clone = fast_duplicate_project(project, request.user)
            try:
                clone.title = clone.title + _("(copy)")
                clone.save()
            except (ValidationError, TypeError):
                pass
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(
                clone, context={"user": request.user}
            ).data,
            "type": "project",
        }
    )


# Add an object set to a project
@user_can_edit("projectPk")
def json_api_post_add_object_set(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    project = Project.objects.get(pk=body.get("projectPk"))
    term = body.get("term")
    title = body.get("title")
    translation_plural = body.get("translation_plural")
    try:
        project.object_sets.create(
            term=term,
            title=title,
            translation_plural=translation_plural,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "new_dict": ProjectSerializerShallow(project).data["object_sets"],
        }
    )


@login_required
@api_view(["GET"])
def json_api__project__discipline__list(request):
    if request.method == "GET":
        disciplines = Discipline.objects.order_by("title")
        serializer = DisciplineSerializer(disciplines, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


#########################################################
# HELPERS
#########################################################
def get_project_urls_by_pk(project_pk):
    return {
        "activity": reverse(
            "course_flow:activity-create", kwargs={"projectPk": project_pk}
        ),
        "course": reverse(
            "course_flow:course-create", kwargs={"projectPk": project_pk}
        ),
        "program": reverse(
            "course_flow:program-create", kwargs={"projectPk": project_pk}
        ),
    }
