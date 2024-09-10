import json

from django.contrib.auth.decorators import login_required
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.decorators import (
    user_can_edit,
    user_can_view,
    user_is_teacher,
)
from course_flow.duplication_functions import fast_duplicate_project
from course_flow.models import ObjectPermission, Project, Workflow
from course_flow.models.discipline import Discipline
from course_flow.serializers import DisciplineSerializer
from course_flow.serializers.project import (
    CreateProjectSerializer,
    ProjectSerializerShallow,
)
from course_flow.serializers.workflow import InfoBoxSerializer
from course_flow.utils import get_user_permission
from course_flow.view_utils import get_my_projects
from course_flow.views.mixins import UserCanViewMixin


class ProjectEndpoint:
    #########################################################
    # CREATE
    #########################################################

    @staticmethod
    @user_is_teacher()
    @api_view(["POST"])
    def create(request: Request) -> Response:
        # instantiate the form with the JSON params
        serializer = CreateProjectSerializer(data=request.data)
        if serializer.is_valid():
            # Save the Project instance and set the author
            project = serializer.save(author=request.user)

            return Response(
                {"action": "posted", "data_package": {"id": project.id}},
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )


#########################################################
# GET
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

    current_user = request.user

    serializer = ProjectSerializerShallow(
        project, context={"user": current_user, "request": request}
    )

    disciplines = DisciplineSerializer(
        Discipline.objects.order_by("title"), many=True
    ).data

    user_permission = get_user_permission(project, current_user)

    public_view = False  # moved from template layer
    is_strategy = False

    response_data = {
        "project_data": serializer.data,
        # @todo bad
        "userId": current_user.id if current_user else 0,
        "userName": current_user.username,
        "userPermission": user_permission,
        "disciplines": disciplines,
        "isStrategy": is_strategy,
        "publicView": public_view,
    }

    return JsonResponse({"action": "GET", "data_package": response_data})


@user_is_teacher()
def json_api_post_get_target_projects(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    try:
        workflow_id = Workflow.objects.get(pk=body.get("workflowPk")).id
    except ObjectDoesNotExist:
        workflow_id = 0
    try:
        data_package = get_my_projects(request.user, False, for_add=True)
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "workflow_id": workflow_id,
        }
    )


@user_can_view("projectPk")
def json_api_post_get_project_data(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    project = Project.objects.get(pk=body.get("projectPk"))
    try:
        project_data = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(
                    project, context={"user": request.user}
                ).data
            )
            .decode("utf-8")
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "project_data": project_data,
        }
    )


@user_is_teacher()
def json_api_post_get_projects_for_create(
    request: HttpRequest,
) -> JsonResponse:
    user = request.user
    try:
        projects = list(Project.objects.filter(author=user, deleted=False)) + [
            user_permission.content_object
            for user_permission in ObjectPermission.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(Project),
                project__deleted=False,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
        ]
        projects_serialized = InfoBoxSerializer(
            projects,
            many=True,
            context={"user": user},
        ).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": projects_serialized,
        }
    )


@permission_classes([UserCanViewMixin])
@api_view(["GET"])
@login_required
def json_api__project__detail__comparison__get(request):
    project_pk = request.GET.get("id")
    try:
        project = Project.objects.get(pk=project_pk)

    except Project.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    # moved from template layer
    public_view = False
    is_strategy = False

    current_user = request.user
    user_permission = get_user_permission(project, current_user)

    response_data = {
        "project_data": ProjectSerializerShallow(
            project, context={"user": current_user}
        ).data,
        "user_id": current_user.id if current_user else 0,
        "is_strategy": is_strategy,
        "user_permission": user_permission,
        "public_view": public_view,
        "user_name": current_user.username,
    }

    return JsonResponse({"action": "GET", "data_package": response_data})


# @user_is_teacher()
# def json_api_post_create_project(request: HttpRequest) -> JsonResponse:
#     # instantiate the form with the JSON params
#     data = json.loads(request.body)
#     form = CreateProject(json.loads(request.body))
#
#     # if the form is valid, save it and return a success response
#     # along with the redirect URL to the newly created project
#     if form.is_valid():
#         project = form.save()
#         project.author = request.user
#         project.save()
#
#         # Create the object sets, if any
#         object_sets = data["objectSets"]
#         for object_set in object_sets:
#             title = "Untitled Set"
#             if object_set["label"] is not None and object_set["label"] != "":
#                 title = object_set["label"]
#             project.object_sets.create(term=object_set["type"], title=title)
#
#         return JsonResponse(
#             {
#                 "action": "posted",
#                 "redirect": reverse(
#                     "course_flow:project-update", kwargs={"pk": project.pk}
#                 ),
#             }
#         )
#
#     # otherwise, return the errors so UI can display errors accordingly
#     return JsonResponse({"action": "error", "errors": form.errors})


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
