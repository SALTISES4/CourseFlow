"""
@todo what is this file doing
"""
import math
from functools import reduce
from itertools import chain
from operator import attrgetter

from django.db.models import Count, Q

from course_flow.apps import logger
from course_flow.models import Project, User
from course_flow.models.objectPermission import ObjectPermission
from course_flow.serializers import FavouriteSerializer
from course_flow.services import DAO, Utility


class LibraryService:
    @staticmethod
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

    @staticmethod
    def get_explore_objects(user, name_filter, nresults, published, data):
        """
        leave user here, as we will probably need a filter of objects user has access to
        :param user:
        :param name_filter:
        :param nresults:
        :param published:
        :param data:
        :return:
        """
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
                        DAO.get_model_from_str(model_type)
                        .objects.filter(published=True)
                        .annotate(num_nodes=Count("workflows__weeks__nodes"))
                        .filter(**filter_kwargs)
                        .filter(q_objects)
                        .exclude(deleted=True)
                        .distinct()
                        if model_type == "project"
                        else DAO.get_model_from_str(model_type)
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
                            return Utility.get_relevance(
                                x, name_filter, keywords
                            )

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
                meta = {
                    "total_results": total_results,
                    "page_count": page_number,
                    "current_page": page,
                    "results_per_page": nresults,
                }

            except TypeError as e:
                logger.exception("An error occurred")
                return_objects = Project.objects.none()
                meta = {}

        else:
            return_objects = Project.objects.none()
            meta = {}
        return return_objects, meta

    @staticmethod
    def get_top_favourites(user: User):
        """
        Prepare 5 most recent favourites, using a serializer that will give just the url and name
        :param user:
        :return:
        """

        favourites_query = [
            x.content_object
            for x in user.favourite_set.filter(
                Q(
                    workflow__deleted=False,
                    workflow__project__deleted=False,
                )
                | Q(project__deleted=False)
            )[:5]
        ]

        favourites = FavouriteSerializer(
            favourites_query,
            many=True,
            context={"user": user},
        ).data

        return {
            "favourites": favourites,
        }


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
#         model = DAO.get_model_from_str(model_type)
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
