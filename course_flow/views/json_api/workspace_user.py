import json
import logging
from enum import Enum
from pprint import pprint

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType

# from duplication
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.decorators import user_can_edit
from course_flow.models import User
from course_flow.models.notification import Notification
from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.serializers import (
    ObjectPermissionCreateSerializer,
    ObjectPermissionDeleteSerializer,
    ObjectPermissionUpdateSerializer,
    UserSerializer,
)
from course_flow.services import DAO
from course_flow.views.json_api._validators import DeleteRequestSerializer


class ObjectType(Enum):
    NODE = "node"
    WEEK = "week"
    WORKFLOW = "workflow"
    ACTIVITY = "activity"
    COURSE = "course"
    PROGRAM = "program"
    OUTCOME = "program"
    COLUMN = "column"
    NODELINK = "nodelink"


class WorkspaceUserEndpoint:
    @staticmethod
    # @user_can_view(False)
    @api_view(["POST"])
    def list(request: Request, pk: int) -> Response:
        """
        This is about getting users by workspace object (project or workflow only)
        :param pk:
        :param request:
        :return:
        """
        editors = set()
        viewers = set()
        commentors = set()
        students = set()
        public_view = False

        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.log(logging.INFO, "invalid serializer")
            return Response(serializer.errors, status=400)

        # passing payload data to local objects
        object_id = pk
        object_type = serializer.validated_data["object_type"]

        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"

        content_type = ContentType.objects.get(model=object_type)
        this_object = DAO.get_model_from_str(object_type).objects.get(id=object_id)
        published = this_object.published

        if object_type == "workflow":
            public_view = this_object.public_view
        try:
            this_object = DAO.get_model_from_str(object_type).objects.get(id=object_id)
            cannot_change = []

            if this_object.author is not None:
                cannot_change = [this_object.author.id]
                author = UserSerializer(this_object.author).data
                if object_type == "workflow" and not this_object.is_strategy:
                    cannot_change.append(this_object.get_project().author.id)
            else:
                author = None

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_EDIT.value,
            ).select_related("user"):
                editors.add(object_permission.user)

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_VIEW.value,
            ).select_related("user"):
                viewers.add(object_permission.user)

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_COMMENT.value,
            ).select_related("user"):
                commentors.add(object_permission.user)

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_STUDENT.value,
            ).select_related("user"):
                students.add(object_permission.user)

            try:
                if Group.objects.get(name="SALTISE_Staff") in request.user.groups.all():
                    saltise_user = True
                else:
                    saltise_user = False
            except ObjectDoesNotExist as e:
                logger.exception("An error occurred")
                saltise_user = False

            is_template = this_object.is_template

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})

        return Response(
            {
                "message": "success",
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
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    # @user_can_edit(False)
    @api_view(["POST"])
    def create(request: Request, pk: int) -> Response:
        """
        Creates a new ObjectPermission entry for a user.

        :param request:
        :param pk:
        :return:
        """

        serializer = ObjectPermissionCreateSerializer(data=request.data, context={"pk": pk})

        if serializer.is_valid():
            # Save the new permission
            serializer.save()
            return Response(
                {"action": "created", "message": _("Permission created successfully.")},
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {"action": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
            )

    # @staticmethod
    # @user_can_edit("objectId")
    # @api_view(["POST"])
    # def delete(request: Request, pk: int) -> Response:
    #     """
    #     Deletes a user's permission for a specific object.
    #     :param request: The HTTP request containing user ID and object details.
    #     :return: A JSON response indicating the result of the operation.
    #     """
    #     body = request.data
    #     object_id = pk
    #
    #     body = json.loads(request.body)
    #     object_type = body.get("objectType")
    #
    #     # Validate object_type and map to correct model if needed
    #     if object_type in ["activity", "course", "program"]:
    #         object_type = "workflow"
    #
    #     user_id = body.get("permission_user")
    #
    #     try:
    #
    #
    #
    #
    #         # Retrieve the user and object for permission deletion
    #         user = User.objects.get(id=user_id)
    #         item = DAO.get_model_from_str(object_type).objects.get(id=object_id)
    #
    #         # Attempt to delete the corresponding ObjectPermission
    #         ObjectPermission.objects.filter(
    #             user=user,
    #             content_type=ContentType.objects.get_for_model(item),
    #             object_id=object_id,
    #         ).delete()
    #
    #         # Return success message if no exceptions occur
    #         return Response(
    #             {"message": "success"},
    #             status=status.HTTP_200_OK
    #         )
    #
    #     except User.DoesNotExist:
    #         return Response(
    #             {"message": "error", "error": _("User not found.")},
    #             status=status.HTTP_404_NOT_FOUND
    #         )
    #     except ObjectPermission.DoesNotExist:
    #         return Response(
    #             {"message": "error", "error": _("Permission not found.")},
    #             status=status.HTTP_404_NOT_FOUND
    #         )
    #     except Exception as e:
    #         logger.exception("An error occurred during permission deletion")
    #         return Response(
    #             {"message": "error", "error": _("An unexpected error occurred.")},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )

    @staticmethod
    @api_view(["POST"])
    def delete(request: Request, pk: int) -> Response:
        """
        Deletes an ObjectPermission entry for a user and object.
        :param request: The HTTP request containing the payload with userId and type.
        :param pk: The primary key of the object being deleted (in the URL).
        :return: A JSON response indicating the result of the operation.
        """
        serializer = ObjectPermissionDeleteSerializer(data=request.data, context={"pk": pk})

        if serializer.is_valid():
            # Perform deletion
            serializer.delete()
            return Response({"message": "success"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    # @user_can_edit(False)
    @api_view(["POST"])
    def update(request: Request, pk: int) -> Response:
        """
        Updates an existing ObjectPermission entry for a user.
        """
        serializer = ObjectPermissionUpdateSerializer(data=request.data)

        if serializer.is_valid():
            # Update the permission
            updated_permission = serializer.update(
                serializer.context["object_permission"], serializer.validated_data
            )

            pprint(updated_permission)

            # DAO.make_user_notification(
            #     source_user=request.user,
            #     target_user=updated_permission,
            #     notification_type=Notification.TYPE_SHARED,
            #     content_object=item,
            # )

            return Response(
                {"action": "updated", "message": _("Permission updated successfully.")},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"action": "error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
            )

    @staticmethod
    # @user_can_edit(False)
    @api_view(["POST"])
    def json_api_post_set_permission(request: Request) -> Response:
        """

        :return:
        """
        body = json.loads(request.body)
        object_id = body.get("objectId")
        object_type = body.get("objectType")

        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"

        user_id = body.get("permission_user")
        permission_type = body.get("permission_type")
        response = {}

        try:
            user = User.objects.get(id=user_id)
            if (
                permission_type
                in [
                    Permission.PERMISSION_EDIT.value,
                    Permission.PERMISSION_VIEW.value,
                    Permission.PERMISSION_COMMENT.value,
                ]
                and Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all()
            ):
                return Response(
                    {
                        "action": "error",
                        "error": _("User is not a teacher."),
                    }
                )

            item = DAO.get_model_from_str(object_type).objects.get(id=object_id)
            # if hasattr(item, "get_subclass"):
            #     item = item.get_subclass()

            project = item.get_project()
            if permission_type != Permission.PERMISSION_EDIT.value:
                if item.author == user or (project is not None and project.author == user):
                    response = Response(
                        {
                            "action": "error",
                            "error": _("This user's role cannot be changed."),
                        }
                    )
                    # response.status_code = 403
                    return response

            # Not currently enabled
            if permission_type == Permission.PERMISSION_STUDENT.value:
                raise ValidationError

            ObjectPermission.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(item),
                object_id=object_id,
            ).delete()

            if permission_type != Permission.PERMISSION_NONE.value:
                ObjectPermission.objects.create(
                    user=user, content_object=item, permission_type=permission_type
                )
                DAO.make_user_notification(
                    source_user=request.user,
                    target_user=user,
                    notification_type=Notification.TYPE_SHARED,
                    content_object=item,
                )
            response["action"] = "posted"

        except ValidationError as e:
            logger.exception("An error occurred")
            response["action"] = "error"

        return Response(response)
