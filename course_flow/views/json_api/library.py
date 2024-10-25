"""
@todo what is this file doing
"""
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
from course_flow.models.favourite import Favourite
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.workspace.workflow import Workflow
from course_flow.serializers import LibraryObjectSerializer, SearchSerializer
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
        library_objects_serialized = LibraryObjectSerializer(
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
            item = DAO.get_model_from_str(object_type).objects.get(pk=object_id)

            # @todo fix this unecessary operation
            Favourite.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(item),
                object_id=object_id,
            ).delete()

            if favourite:
                Favourite.objects.create(user=request.user, content_object=item)

        except ValidationError as e:
            logger.exception("An error occurred")
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

        if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
            projects_serialized = []
        else:
            projects = [
                op.content_object
                for op in ObjectPermission.objects.filter(
                    project__deleted=False, user=user
                ).order_by("-last_viewed")[:2]
            ]

            # @todo
            # no...
            # either one query for templates or keep them separate
            templates = list(
                Project.objects.filter(deleted=False, published=True, is_template=True)
            ) + list(Workflow.objects.filter(deleted=False, published=True, is_template=True))

            projects_serialized = LibraryObjectSerializer(
                projects, many=True, context={"user": user}
            ).data

            templates_serialized = LibraryObjectSerializer(
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
    # LIBRARY
    #########################################################

    @staticmethod
    @login_required
    @api_view(["POST"])
    def search(
        request: Request,
    ) -> Response:
        """

        This is a multifunctional endpoint, it generally can be used for any type of list query
        that returns a 'workspace' object, e.g:
        workflow (all variations)
        project
        then templates / strategies

        these objects are simplified/normalized into a 'library' object view for displaying in a paginated list
        with filters

        filters are split into implicit and explicit
        explicit filters are generally items that the user can control through the UI
        implicit filters are set to control the view type and may be derived (TBD)

        results_per_page: number
        published: boolean

        keyword: string -> keyword search
        owned: boolean -> current use is author
        favourites: boolean -> is favourited by current user
        archived: boolean -> is in state 'archived'


        # sorting
        a-z
        by date


        :param request:
        :return:
        """
        library_service = LibraryService()
        serializer = SearchSerializer(data=request.data)
        pprint(request.data)

        if not serializer.is_valid():
            logger.exception(f"Logged Exception: : {serializer.errors}")
            return Response(serializer.errors, status=400)

        try:
            data = serializer.validated_data

            # handles if values is undefined but not NULL (none)
            # default filters are actually applied in the service layer
            # we probably don't need them here
            pagination = data.get("pagination", LibraryService.defaultPagination)
            sort = data.get("sort", LibraryService.defaultSort)
            filters = data.get("filters", LibraryService.defaultFilters)

            items, meta = library_service.get_objects(
                user=request.user,
                filters=filters,
                sort=sort,
                pagination=pagination,
            )

            data_package = {
                "items": LibraryObjectSerializer(
                    items, context={"user": request.user}, many=True
                ).data,
                "meta": meta,
            }

            return Response(
                {
                    "message": "success",
                    "data_package": data_package,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception("An error occurred")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # serializer is not valid
