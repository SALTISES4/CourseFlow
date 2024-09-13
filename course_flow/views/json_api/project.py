import json

from django.contrib.auth.decorators import login_required
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.decorators import user_can_edit, user_can_view
from course_flow.duplication_functions import fast_duplicate_project
from course_flow.models import ObjectPermission, Project, Workflow
from course_flow.models.objectPermission import Permission
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
    @staticmethod
    @api_view(["GET"])
    @login_required
    # @permission_classes([UserCanViewMixin])
    def fetch_detail(request: Request, pk: int) -> Response:
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        current_user = request.user
        serializer = ProjectSerializerShallow(
            project, context={"user": current_user, "request": request}
        )

        user_permission = get_user_permission(project, current_user)

        public_view = False  # moved from template layer
        is_strategy = False

        response_data = {
            "project_data": serializer.data,
            # @todo bad
            "userId": current_user.id if current_user else 0,
            "userName": current_user.username,
            "userPermission": user_permission,
            "isStrategy": is_strategy,
            "publicView": public_view,
        }

        return Response(
            {
                "action": "GET",
                "data_package": response_data,
            }
        )

    def list_my_projects(request: HttpRequest) -> JsonResponse:
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

    #########################################################
    # DUPLICATE
    #########################################################

    @staticmethod
    @user_can_view("projectPk")
    def duplicate(request: Request, pk: int) -> Response:
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
            return Response({"action": "error"})

        return Response(
            {
                "action": "posted",
                "new_item": InfoBoxSerializer(
                    clone, context={"user": request.user}
                ).data,
                "type": "project",
            }
        )

    #########################################################
    # RELATIONS
    #########################################################
    @staticmethod
    @user_can_view("projectPk")
    @api_view(["POST"])
    def workflows__list(
        request: Request,
    ) -> Response:
        body = json.loads(request.body)
        try:
            user = request.user
            project = Project.objects.get(pk=body.get("projectPk"))
            workflows_serialized = InfoBoxSerializer(
                project.workflows.all(), many=True, context={"user": user}
            ).data

        except AttributeError:
            return Response({"action": "error"})

        return Response(
            {
                "action": "posted",
                "data_package": workflows_serialized,
            }
        )

    @staticmethod
    @user_can_edit("projectPk")
    def object_set__create(request: Request, pk: int) -> Response:
        """
        Add an object set to a project
        :param pk:
        :param request:
        :return:
        """
        body = json.loads(request.body)
        project = Project.objects.get(pk=pk)

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
            return Response({"action": "error"})
        return Response(
            {
                "action": "posted",
                "new_dict": ProjectSerializerShallow(project).data[
                    "object_sets"
                ],
            }
        )


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
                permission_type=Permission.PERMISSION_EDIT.value,
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
