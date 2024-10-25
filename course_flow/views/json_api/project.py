import json
import logging
from pprint import pprint

from django.contrib.auth.decorators import login_required
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.decorators import user_can_edit, user_can_view
from course_flow.duplication_functions import fast_duplicate_project
from course_flow.models import ObjectPermission, Project, Workflow
from course_flow.models.objectPermission import Permission
from course_flow.serializers import LibraryObjectSerializer
from course_flow.serializers.project import (
    ProjectSerializerShallow,
    ProjectUpsertSerializer,
)
from course_flow.services import DAO
from course_flow.services.project import ProjectService
from course_flow.views.mixins import UserCanViewMixin


class ProjectEndpoint:
    #########################################################
    # CREATE
    #########################################################
    @staticmethod
    @api_view(["POST"])
    def create(request: Request) -> Response:
        serializer = ProjectUpsertSerializer(data=request.data)

        if not serializer.is_valid():
            logger.exception(f"Logged Exception: : {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = serializer.save(author=request.user)

        return Response(
            {"message": "success", "data_package": {"id": project.id}},
            status=status.HTTP_201_CREATED,
        )

    #########################################################
    # UPDATE
    #########################################################
    @staticmethod
    @api_view(["POST"])
    def update(request: Request, pk: int) -> Response:
        try:
            project = Project.objects.get(id=pk)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProjectUpsertSerializer(project, data=request.data)

        if not serializer.is_valid():
            logger.exception(f"Logged Exception: : {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = serializer.save()
        return Response(
            {"message": "success", "data_package": {"id": project.id}},
            status=status.HTTP_200_OK,
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

        response_data = serializer.data

        return Response(
            {
                "action": "GET",
                "data_package": response_data,
            }
        )

    @api_view(["POST"])
    def list_my_projects(request: Request) -> Response:
        # body = json.loads(request.body)
        # try:
        #     workflow_id = Workflow.objects.get(pk=body.get("workflowPk")).id
        # except ObjectDoesNotExist:
        #     workflow_id = 0

        try:
            data_package = ProjectService.get_my_projects(request.user)
        except AttributeError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})

        return Response(
            {
                "message": "success",
                "data_package": data_package,
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
                # @todo this might be
                clone = fast_duplicate_project(project, request.user)
                try:
                    clone.title = clone.title + _("(copy)")
                    clone.save()
                except (ValidationError, TypeError):
                    pass
        except ValidationError as e:
            logger.exception("An error occurred")
            return Response(
                {
                    "error": "you have error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "success",
                "new_item": LibraryObjectSerializer(clone, context={"user": request.user}).data,
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
            workflows_serialized = LibraryObjectSerializer(
                project.workflows.all(), many=True, context={"user": user}
            ).data

        except AttributeError as e:
            logger.exception("An error occurred")
            return Response(
                {
                    "error": "you have error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "success",
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
        except ValidationError as e:
            logger.exception("An error occurred")
            return Response(
                {
                    "error": "you have error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {
                "message": "success",
                "new_dict": ProjectSerializerShallow(project).data["object_sets"],
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
        projects_serialized = LibraryObjectSerializer(
            projects,
            many=True,
            context={"user": user},
        ).data
    except AttributeError as e:
        logger.exception("An error occurred")
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "message": "success",
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
    user_permission = DAO.get_user_permission(project, current_user)

    response_data = {
        "project_data": ProjectSerializerShallow(project, context={"user": current_user}).data,
        "user_id": current_user.id if current_user else 0,
        "is_strategy": is_strategy,
        "user_permission": user_permission,
        "public_view": public_view,
        "user_name": current_user.username,
    }

    return JsonResponse({"action": "GET", "data_package": response_data})
