"""
@todo what is this file doing
"""
import logging
from pprint import pprint

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.models import Project
from course_flow.models.discipline import Discipline
from course_flow.models.favourite import Favourite
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.workflow import Workflow
from course_flow.serializers import DisciplineSerializer, InfoBoxSerializer
from course_flow.services import DAO
from course_flow.services.library import LibraryService
from course_flow.templatetags.course_flow_templatetags import has_group


class LibraryEndpoint:
    @staticmethod
    @login_required
    @api_view(["POST"])
    def fetch__favourite_library_objects(
        request: Request,
    ) -> Response:
        library_objects_serialized = InfoBoxSerializer(
            DAO.get_nondeleted_favourites(request.user),
            many=True,
            context={"user": request.user},
        ).data

        return Response(
            {
                "message": "success",
                "data_package": {
                    "results": library_objects_serialized,
                    "meta": {
                        "pages": 1,
                    },
                },
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    # @user_can_view(False)
    @api_view(["POST"])
    def toggle_favourite(
        request: Request,
    ) -> Response:
        """
        favourite/unfavourite a project or workflow for a user
        :param request:
        :return:
        """
        data = request.data

        object_id = data["id"]
        object_type = data["object_type"]
        favourite = data["favourite"]

        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"

        try:
            item = DAO.get_model_from_str(object_type).objects.get(
                pk=object_id
            )

            # @todo fix this unecessary operation
            Favourite.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(item),
                object_id=object_id,
            ).delete()

            if favourite:
                Favourite.objects.create(
                    user=request.user, content_object=item
                )

        except ValidationError as e:
            logger.log(logging.INFO, e)
            return Response(
                {"error": "error toggling favourites"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"message": "success"}, status=status.HTTP_200_OK)

    #########################################################
    # HOME
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def fetch__home(request: Request) -> Response:
        user = request.user
        templates_serialized = []

        if (
            Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
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
        return Response(
            {
                "action": "get",
                "data_package": data,
            },
            status=status.HTTP_200_OK,
        )

    #########################################################
    # EXPLORE
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def fetch__explore(request: Request) -> Response:
        user = request.user
        # initial_workflows, pages = get_explore_objects(
        #     user,
        #     "",
        #     20,
        #     True,
        #     {"sort": "created_on", "sort_reversed": True},
        # )

        data = {
            # "initial_workflows": (
            #     InfoBoxSerializer(
            #         initial_workflows,
            #         context={"user": user},
            #         many=True,
            #     ).data
            # ),
            # "initial_pages": pages,
            "disciplines": DisciplineSerializer(
                Discipline.objects.all(), many=True
            ).data,
            "user_id": user.id
            if user
            else 0,  # @todo this should handle null not 0, or perhaps -1
        }

        return Response(
            {
                "action": "get",
                "data_package": data,
            },
            status=status.HTTP_200_OK,
        )

    #########################################################
    # LIBRARY
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def fetch__projects(
        request: Request,
    ) -> Response:
        user = request.user

        all_projects = list(
            Project.objects.filter(user_permissions__user=user)
        )
        all_projects += list(
            Workflow.objects.filter(
                user_permissions__user=user, is_strategy=True
            )
        )

        projects_serialized = InfoBoxSerializer(
            all_projects, many=True, context={"user": user}
        ).data

        return Response(
            {"action": "get", "data_package": projects_serialized},
            status=status.HTTP_200_OK,
        )

    #########################################################
    # LIBRARY
    #########################################################
    @staticmethod
    @login_required
    @api_view(["POST"])
    def search(
        request: Request,
    ) -> Response:
        try:
            data = request.data
            pprint("data")
            pprint(data)
            # name_filter = body.get("filter").lower()
            name_filter = data.get("filter", "").lower()
            args = data.get("args", "{}")
            nresults = args.get("results_per_page", 10)
            full_search = args.get("full_search", False)
            published = args.get("published", False)

            print(nresults, full_search, published)

            # A full search of all objects, paginated
            if full_search:
                return_objects, pages = LibraryService.get_explore_objects(
                    request.user, name_filter, nresults, published, args
                )
            # Small search for library
            else:
                return_objects = LibraryService.get_library_objects(
                    request.user, name_filter, nresults
                )
                pages = {}

            data_package = {
                "results": InfoBoxSerializer(
                    return_objects, context={"user": request.user}, many=True
                ).data,
                "meta": {
                    "pages": pages,
                },
            }

            return Response(
                {
                    "message": "success",
                    "data_package": data_package,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.log(logging.INFO, e)
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )
