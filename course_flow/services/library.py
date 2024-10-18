"""
@todo what is this file doing
"""
import math
from pprint import pprint

from django.db.models import Case, CharField, Count, Q, Value, When

from course_flow.apps import logger
from course_flow.models import User
from course_flow.serializers import FavouriteSerializer
from course_flow.services import DAO, Utility

SUBCLASSES = ["activity", "course", "program"]


class LibraryService:
    # defaultFilters = {
    #     "keyword": None,
    #     "object_type": ["project", "workflow"],
    #     "owned": False,
    #     "published": False,
    #     "archive": False,
    #     "is_favourite": False,
    #     "is_template": False
    # }
    #
    # defaultSort = {
    #     "direction": "ASC",
    #     "sort": "DATE"  # relevance, date created, alpha
    # }
    #
    # defaultMeta = {
    #     "page": 0,
    #     "results_per_page": 10  # relevance, date created, alpha
    # }

    defaultFilters = {}

    defaultSort = {}

    defaultMeta = {}

    def get_objects(self, user, sort=None, filters=None, meta=None):
        """
        Retrieves objects filtered by user, keywords, and other criteria.
        Supports pagination and sorting by relevance or other fields.
        """
        # Merge passed filters, sorting, and meta with defaults
        utility_service = Utility()

        merged_filters = utility_service.merge_dicts(self.defaultFilters, filters)
        merged_sort = utility_service.merge_dicts(self.defaultSort, sort)
        merged_meta = utility_service.merge_dicts(self.defaultMeta, meta)

        pprint(merged_filters)
        pprint(merged_sort)
        pprint(merged_meta)

        # Apply filters and build querysets
        queryset_1 = self.build_queryset(merged_filters)

        # Apply sorting
        queryset = self.apply_sorting(queryset_1, merged_sort)

        # Paginate the result
        return_objects, meta = self.apply_pagination(queryset, merged_meta)

        # Iterate over the combined queryset to maintain the sort order and recreate instances
        project_model = DAO.get_model_from_str("project")
        workflow_model = DAO.get_model_from_str("workflow")

        # Dictionary to store preloaded objects by type and id for quick access
        project_ids = [item.id for item in queryset_1 if item.hell_type == "project"]
        workflow_ids = [item.id for item in queryset_1 if item.hell_type == "activity"]

        # Preload all project and workflow objects based on their IDs
        project_objects = {obj.id: obj for obj in project_model.objects.filter(id__in=project_ids)}

        workflow_objects = {
            obj.id: obj for obj in workflow_model.objects.filter(id__in=workflow_ids)
        }

        # Now loop through the return_objects while maintaining the original order
        formatted_items = []
        for item in return_objects:
            if item.hell_type == "project":
                instance = project_objects.get(item.id)  # Use .get() to avoid KeyError
                if instance:
                    formatted_items.append(instance)

            elif item.hell_type == "activity":
                instance = workflow_objects.get(item.id)  # Use .get() to avoid KeyError
                if instance:
                    formatted_items.append(instance)

        # Return the formatted items and meta
        return formatted_items, meta

    def build_queryset(self, filters):
        """
        Build and return the queryset based on filters.
        """
        # Start by creating keyword-based Q objects
        q_objects = self.build_keyword_filter(filters["keyword"])
        filter_kwargs = {}

        # Filter by disciplines (if applicable)
        # disciplines = filters.get("disciplines")
        # if disciplines:
        #     filter_kwargs["disciplines__in"] = disciplines

        # Filter by published and deleted status
        # filter_kwargs["published"] = True
        filter_kwargs["deleted"] = False
        filter_kwargs["hell_type"] = "project"
        fields = [
            "id",
            "title",
            "description",
            "deleted",
            "created_on",
            "last_modified",
            "published",
            "author_id",
            "is_strategy",
            "is_template",
            "deleted",
            "description",
        ]
        # Query for "project" model
        project_queryset = (
            DAO.get_model_from_str("project")
            .objects.select_related("author")
            .annotate(hell_type=Value("project", output_field=CharField()))
            .filter(**filter_kwargs)
            #  .filter(type="activity")  # Filter on the annotated 'type' field after annotation
            #  .filter(q_objects)
            #            .annotate(num_nodes=Count("workflows__weeks__nodes"))
            .only(*fields)
            .distinct()
        )

        # Query for "workflow" model
        workflow_queryset = (
            DAO.get_model_from_str("workflow")
            .objects.select_related("author")
            .annotate(hell_type=Value("activity", output_field=CharField()))
            # .annotate(
            #     type=Case(
            #         # Check if each subclass exists and return its 'type'
            #         *[
            #             When(**{f"{subclass}__isnull": False}, then=Value(subclass))
            #             for subclass in SUBCLASSES
            #         ],
            #         # Default value if no subclass is found
            #         default=Value("workflow"),
            #         output_field=CharField(),
            #     )
            # )
            .filter(**filter_kwargs)
            # .filter(type="activity")
            # .filter(q_objects)
            #     .annotate(num_nodes=Count("weeks__nodes"))
            .only(*fields)
            .distinct()
        )

        # Combine the two querysets with `union()`
        queryset = project_queryset.union(workflow_queryset)

        return queryset

    def build_keyword_filter(self, keyword_string):
        """
        Build a Q object for keyword-based filtering.
        """
        q_objects = Q()
        if keyword_string:
            keywords = keyword_string.split(" ")
            for keyword in keywords:
                q_objects &= (
                    Q(author__first_name__icontains=keyword)
                    | Q(author__username__icontains=keyword)
                    | Q(author__last_name__icontains=keyword)
                    | Q(title__icontains=keyword)
                    | Q(description__icontains=keyword)
                )
        return q_objects

    def apply_sorting(self, queryset, sort):
        """
        Apply sorting to the queryset.
        """
        sort_field = sort.get("sort", "created_on")
        direction = sort.get("direction", "ASC").upper()

        if sort_field == "relevance":
            # Sorting by relevance using a custom method
            queryset = sorted(
                queryset,
                key=lambda x: Utility.get_relevance(x, sort["keywords"]),
                reverse=(direction == "DESC"),
            )
        else:
            # Default sorting by a field
            order_prefix = "-" if direction == "DESC" else ""
            queryset = queryset.order_by(f"{order_prefix}{sort_field}")

        return queryset

    def apply_pagination(self, queryset, meta):
        """
        Apply pagination to the queryset.
        """
        page = meta.get("page", 1)
        results_per_page = meta.get("results_per_page", 10)
        total_results = queryset.count()

        start = max((page - 1) * results_per_page, 0)
        end = min(page * results_per_page, total_results)

        return_objects = list(queryset)[start:end]

        # Pagination metadata
        page_number = math.ceil(total_results / results_per_page)
        meta = {
            "total_results": total_results,
            "page_count": page_number,
            "current_page": page,
            "results_per_page": results_per_page,
        }

        return return_objects, meta

    # def get_objects(self, user, sort=None, filters=None, meta=None):
    #     """
    #     Retrieves objects filtered by user, keywords, and other criteria.
    #     Supports pagination and sorting by relevance or other fields.
    #     """
    #
    #     ## start by merging in the defaults
    #     merged_filters = Utility.merge_dicts(self.defaultFilters, filters)
    #     merged_sort = Utility.merge_dicts(self.defaultSort, sort)
    #     merged_meta = Utility.merge_dicts(self.defaultMeta, meta)
    #
    #     keywords = merged_filters["keyword"].split(" ")
    #     types = merged_filters["types"]
    #     disciplines = merged_filters["disciplines"]
    #     from_saltise = merged_filters["from_saltise"]
    #     content_rich = merged_filters["content_rich"]
    #     sort_reversed = merged_filters["sort_reversed"]
    #
    #     page = filters.get("page", 1)
    #
    #
    #     filter_kwargs = {}
    #
    #     #########################################################
    #     # KEYWORD SEARCH (Q objects for searching across fields)
    #     #########################################################
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
    #     # Apply filters for disciplines, content-rich, and from_saltise
    #     if disciplines:
    #         filter_kwargs["disciplines__in"] = disciplines
    #     if content_rich:
    #         filter_kwargs["num_nodes__gte"] = 3
    #     if from_saltise:
    #         filter_kwargs["from_saltise"] = True
    #
    #     #########################################################
    #     # QUERYSET BUILDING
    #     #########################################################
    #     try:
    #         # Query for "project" model
    #         project_queryset = (
    #             DAO.get_model_from_str("project")
    #             .objects.filter(published=True)
    #             .annotate(num_nodes=Count("workflows__weeks__nodes"))
    #             .filter(**filter_kwargs)
    #             .filter(q_objects)
    #             .exclude(deleted=True)
    #             .distinct())
    #
    #         # Query for "workflow" model
    #         workflow_queryset = (
    #             DAO.get_model_from_str("workflow")
    #             .objects.filter(published=True)
    #             .annotate(num_nodes=Count("weeks__nodes"))
    #             .filter(**filter_kwargs)
    #             .filter(q_objects)
    #             .exclude(Q(deleted=True) | Q(project__deleted=True))
    #             .distinct()
    #         )
    #
    #         # Use `union` to combine querysets for different types
    #         queryset = project_queryset.union(workflow_queryset)
    #
    #         #########################################################
    #         # SORTING
    #         #########################################################
    #         if sort is not None:
    #             if sort == "created_on" or sort == "title":
    #                 queryset = queryset.order_by(f'-{sort}' if sort_reversed else sort)
    #             elif sort == "relevance":
    #                 # Sorting by relevance using a custom method
    #                 queryset = sorted(queryset, key=lambda x: Utility.get_relevance(x, keywords), reverse=sort_reversed)
    #
    #         # Pagination
    #         total_results = queryset.count() if isinstance(queryset, QuerySet) else len(queryset)
    #         start = max((page - 1) * nresults, 0)
    #         end = min(page * nresults, total_results)
    #         return_objects = list(queryset)[start:end]
    #
    #         page_number = math.ceil(float(total_results) / nresults)
    #         meta = {
    #             "total_results": total_results,
    #             "page_count": page_number,
    #             "current_page": page,
    #             "results_per_page": nresults,
    #         }
    #
    #     except Exception as e:
    #         logger.exception("An error occurred during query execution.")
    #         return_objects = []
    #         meta = {}
    #
    #     return return_objects, meta

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


# for keyword in keywords:
#       # Q objects for filtering
#       q_objects &= (
#           Q(author__first_name__icontains=keyword)
#           | Q(author__username__icontains=keyword)
#           | Q(author__last_name__icontains=keyword)
#           | Q(title__icontains=keyword)
#           | Q(description__icontains=keyword)
#       )
#
#       # Count occurrences in each field and assign a weight to each match
#       relevance_score += (
#           Case(
#               When(author__first_name__icontains=keyword, then=Value(10)),
#               default=Value(0),
#               output_field=IntegerField()
#           )
#           + Case(
#               When(author__last_name__icontains=keyword, then=Value(8)),
#               default=Value(0),
#               output_field=IntegerField()
#           )
#           + Case(
#               When(author__username__icontains=keyword, then=Value(6)),
#               default=Value(0),
#               output_field=IntegerField()
#           )
#           + Case(
#               When(title__icontains=keyword, then=Value(5)),
#               default=Value(0),
#               output_field=IntegerField()
#           )
#           + Case(
#               When(description__icontains=keyword, then=Value(3)),
#               default=Value(0),
#               output_field=IntegerField()
#           )
#       )
#
#   # Perform the query with the annotated relevance score
#   results = MyModel.objects.filter(q_objects).annotate(
#       relevance=relevance_score
#   ).order_by('-relevance')
