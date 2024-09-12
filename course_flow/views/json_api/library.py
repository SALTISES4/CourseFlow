"""
@todo what is this file doing
"""
import json
import math
from functools import reduce
from itertools import chain
from operator import attrgetter

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.decorators import user_can_view
from course_flow.models import Project
from course_flow.models.discipline import Discipline
from course_flow.models.favourite import Favourite
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.workflow import Workflow
from course_flow.serializers import DisciplineSerializer, InfoBoxSerializer
from course_flow.templatetags.course_flow_templatetags import has_group
from course_flow.utils import (
    get_model_from_str,
    get_nondeleted_favourites,
    get_relevance,
)


class LibraryEndpoint:
    @staticmethod
    @login_required
    @api_view(["POST"])
    def fetch__favourite_library_objects(
        request: Request,
    ) -> Response:
        library_objects_serialized = InfoBoxSerializer(
            get_nondeleted_favourites(request.user),
            many=True,
            context={"user": request.user},
        ).data

        return Response(
            {
                "action": "posted",
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
    @user_can_view(False)
    @api_view(["POST"])
    def toggle_favourite(
        request: Request,
    ) -> Response:
        """
        favourite/unfavourite a project or workflow for a user
        :param request:
        :return:
        """
        body = json.loads(request.body)
        object_id = body.get("objectId")
        object_type = body.get("objectType")
        favourite = body.get("favourite")

        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"
        try:
            item = get_model_from_str(object_type).objects.get(pk=object_id)
            Favourite.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(item),
                object_id=object_id,
            ).delete()

            if favourite:
                Favourite.objects.create(
                    user=request.user, content_object=item
                )

        except ValidationError:
            return Response(
                {"error": "error toggling favourites"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"action": "posted"},
            status=status.HTTP_200_OK,
        )

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
        body = json.loads(request.body)

        # name_filter = body.get("filter").lower()
        name_filter = ""
        data = body.get("args", "{}")
        nresults = data.get("nresults", 10)
        full_search = data.get("full_search", False)
        published = data.get("published", False)

        # A full search of all objects, paginated
        if full_search:
            return_objects, pages = get_explore_objects(
                request.user, name_filter, nresults, published, data
            )
        # Small search for library
        else:
            return_objects = get_library_objects(
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
                "action": "posted",
                data_package: data_package,
            },
            status=status.HTTP_200_OK,
        )


#########################################################
# HELPERS
#########################################################
def get_library_objects(user, name_filter, nresults):
    all_objects = ObjectPermission.objects.filter(user=user).filter(
        Q(project__title__istartswith=name_filter, project__deleted=False)
        | Q(
            workflow__title__istartswith=name_filter,
            workflow__deleted=False,
        )
    )
    # add ordering

    if nresults > 0:
        all_objects = all_objects[:nresults]
    return_objects = [x.content_object for x in all_objects]
    count = len(return_objects)
    if nresults == 0 or count < nresults:
        extra_objects = ObjectPermission.objects.filter(user=user).filter(
            Q(
                project__title__icontains=" " + name_filter,
                project__deleted=False,
            )
            | Q(
                workflow__title__icontains=" " + name_filter,
                workflow__deleted=False,
            )
        )
        if nresults > 0:
            extra_objects = extra_objects[: nresults - count]
        return_objects += [x.content_object for x in extra_objects]
    return return_objects


def get_explore_objects(user, name_filter, nresults, published, data):
    keywords = name_filter.split(" ")
    types = data.get("types", [])
    disciplines = data.get("disciplines", [])
    sort = data.get("sort", None)
    from_saltise = data.get("fromSaltise", False)
    content_rich = data.get("contentRich", False)
    sort_reversed = data.get("sort_reversed", False)
    page = data.get("page", 1)

    filter_kwargs = {}
    # Create filters for each keyword
    q_objects = Q()
    for keyword in keywords:
        q_objects &= (
            Q(author__first_name__icontains=keyword)
            | Q(author__username__icontains=keyword)
            | Q(author__last_name__icontains=keyword)
            | Q(title__icontains=keyword)
            | Q(description__icontains=keyword)
        )
    # Choose which types to search
    if len(types) == 0:
        types = ("project", "workflow")
    # Create disciplines filter
    if len(disciplines) > 0:
        filter_kwargs["disciplines__in"] = disciplines
    if content_rich:
        filter_kwargs["num_nodes__gte"] = 3
    if from_saltise:
        filter_kwargs["from_saltise"] = True

    if published:
        try:
            queryset = reduce(
                lambda x, y: chain(x, y),
                [
                    get_model_from_str(model_type)
                    .objects.filter(published=True)
                    .annotate(num_nodes=Count("workflows__weeks__nodes"))
                    .filter(**filter_kwargs)
                    .filter(q_objects)
                    .exclude(deleted=True)
                    .distinct()
                    if model_type == "project"
                    else get_model_from_str(model_type)
                    .objects.filter(published=True)
                    .annotate(num_nodes=Count("weeks__nodes"))
                    .filter(**filter_kwargs)
                    .filter(q_objects)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                    .distinct()
                    for model_type in types
                ],
            )
            if sort is not None:
                if sort == "created_on" or sort == "title":
                    sort_key = attrgetter(sort)
                elif sort == "relevance":

                    def sort_key(x):
                        return get_relevance(x, name_filter, keywords)

                queryset = sorted(
                    queryset, key=sort_key, reverse=sort_reversed
                )
            queryset = list(queryset)

            total_results = len(queryset)
            return_objects = queryset[
                max((page - 1) * nresults, 0) : min(
                    page * nresults, total_results
                )
            ]
            page_number = math.ceil(float(total_results) / nresults)
            pages = {
                "total_results": total_results,
                "page_count": page_number,
                "current_page": page,
                "results_per_page": nresults,
            }
        except TypeError:
            return_objects = Project.objects.none()
            pages = {}
    else:
        return_objects = Project.objects.none()
        pages = {}
    return return_objects, pages


# def get_explore_objects(user, name_filter, nresults, published, data):
#     # Unpack and set default values from data
#     types = data.get("types", ["project", "workflow"])
#     disciplines = data.get("disciplines", [])
#     sort = data.get("sort", None)
#     from_saltise = data.get("fromSaltise", False)
#     content_rich = data.get("contentRich", False)
#     sort_reversed = data.get("sort_reversed", False)
#     page = data.get("page", 1)
#
#     # Set up filter arguments
#     filter_kwargs = {
#         "published": True,
#         "disciplines__in": disciplines if disciplines else None,
#         "num_nodes__gte": 3 if content_rich else None,
#         "from_saltise": from_saltise,
#     }
#
#     # Combine all keyword queries into a single Q object
#     keywords = name_filter.split()
#     q_objects = Q()
#     for keyword in keywords:
#         q_objects &= (
#             Q(author__first_name__icontains=keyword)
#             | Q(author__username__icontains=keyword)
#             | Q(author__last_name__icontains=keyword)
#             | Q(title__icontains=keyword)
#             | Q(description__icontains=keyword)
#         )
#
#     # Prepare querysets for each type and combine using chain
#     querysets = []
#     for model_type in types:
#         model = get_model_from_str(model_type)
#         extra_excludes = (
#             {} if model_type == "project" else {"project__deleted": True}
#         )
#         queryset = (
#             model.objects.filter(**filter_kwargs)
#             .filter(q_objects)
#             .exclude(deleted=True, **extra_excludes)
#             .distinct()
#         )
#         if model_type != "project":
#             queryset = queryset.annotate(num_nodes=Count("weeks__nodes"))
#         else:
#             queryset = queryset.annotate(
#                 num_nodes=Count("workflows__weeks__nodes")
#             )
#         querysets.append(queryset)
#
#     combined_queryset = list(chain(*querysets))
#
#     # Sorting and pagination
#     if sort:
#         sort_key = (
#             attrgetter(sort)
#             if sort in ["created_on", "title"]
#             else lambda x: get_relevance(x, name_filter, keywords)
#         )
#         combined_queryset.sort(key=sort_key, reverse=sort_reversed)
#
#     # Implement pagination
#     total_results = len(combined_queryset)
#     start_index = max((page - 1) * nresults, 0)
#     end_index = min(page * nresults, total_results)
#     return_objects = combined_queryset[start_index:end_index]
#     pages = {
#         "total_results": total_results,
#         "page_count": math.ceil(total_results / nresults),
#         "current_page": page,
#         "results_per_page": nresults,
#     }
#
#     return return_objects, pages


# def get_model_from_str(model_type):
#     # Placeholder function to convert model type to actual model
#     return {
#         "project": Project,
#         "workflow": Workflow,
#     }.get(
#         model_type, Project
#     )  # Default to Project if type is not recognized
