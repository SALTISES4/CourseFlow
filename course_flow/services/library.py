"""
LibraryService

Provides various methods to retrieve, filter, sort, and paginate objects (projects and workflows) from the database
All items which belong now to the Libray (LibraryObjects) will be generally queried through the
LibraryEndpoint view
Business logic from LibraryEndpoint is here
The bulk of this is the 'search'
there is no true search in this application yet
so we are just doing DB queries via Q

Supports:
 - filters
 - sorting
 - pagination

 - Note we use mapping system from REST objects to an array of differently acting filters

"""
import math
from pprint import pprint

from django.contrib.contenttypes.models import ContentType
from django.db.models import (
    Case,
    CharField,
    Count,
    Exists,
    OuterRef,
    Q,
    Value,
    When,
)

from course_flow.models import Favourite, User
from course_flow.serializers import FavouriteSerializer
from course_flow.services import DAO, Utility

SUBCLASSES = ["activity", "course", "program"]


class LibraryService:
    """
    @todo
    the major piece left here is that we do not do a base filtering on
    - what the user has access to, the dynamic permissions and
    - by extension, child entities
    - since permissions are calculated
    - if user has 'read' or whatever access to a project, how to get all the project workflow children
    - TBD!
    - in general looking a lot more sane though
    """

    defaultPagination = {"page": 0, "results_per_page": 10}

    defaultFilters = {}

    defaultSort = {"direction": "ASC", "value": "DATE_CREATED"}

    def get_objects(self, user, sort=None, filters=None, pagination=None):
        """
        Retrieves objects filtered by user, keywords, and other criteria.
        Supports pagination and sorting by relevance or other fields.
        """
        utility_service = Utility()

        # Merge passed filters, sorting, and meta with defaults
        # handles partially defined objects as well as none type
        # merged_filters = utility_service.merge_dicts(self.defaultFilters, filters)
        merged_filters = filters
        merged_sort = utility_service.merge_dicts(self.defaultSort, sort)
        merged_pagination = utility_service.merge_dicts(self.defaultPagination, pagination)

        pprint("merged_filters")
        pprint(merged_filters)

        # Apply filters and build querysets
        queryset_original = self.build_queryset(merged_filters, user)

        # Apply sorting
        queryset = self.apply_sorting(queryset_original, merged_sort)

        # Paginate the result
        return_objects, pagination = self.apply_pagination(queryset, merged_pagination)

        #########################################################
        # Becuase the DB is split into several models that we're querying as 'one'
        # and we don't have scope tp fix the architecture issues currently
        # i.e. we might as well take the time to push this to a proper search engine
        #
        # we're going to use union to reduce the double DB query
        # but that means not we need to do a small query for the limited results at the end
        # we'll query each model by hits ids and fetch the original Model instance
        # i.e we will 'preload' them in a batch and then reconstruct the original
        # model
        #########################################################

        # load models
        project_model = DAO.get_model_from_str("project")
        workflow_model = DAO.get_model_from_str("workflow")

        # create a dict to store 'preloaded' objects by type and id for ref
        project_ids = [item.id for item in queryset_original if item.annotated_type == "project"]
        workflow_ids = [item.id for item in queryset_original if item.annotated_type in SUBCLASSES]

        # Preload all project and workflow objects based on their IDs
        project_objects = {obj.id: obj for obj in project_model.objects.filter(id__in=project_ids)}
        workflow_objects = {
            obj.id: obj for obj in workflow_model.objects.filter(id__in=workflow_ids)
        }

        # Now loop through the return_objects while reconstruct the order
        formatted_items = []
        for item in return_objects:
            if item.annotated_type == "project":
                instance = project_objects.get(item.id)  # Use .get() to avoid KeyError
                if instance:
                    formatted_items.append(instance)

            elif item.annotated_type in SUBCLASSES:
                instance = workflow_objects.get(item.id)  # Use .get() to avoid KeyError
                if instance:
                    formatted_items.append(instance)

        # Return the formatted items and meta
        return formatted_items, pagination

    def build_queryset(self, filters, user: User):
        """
        Build and return the queryset based on filters.

        published: boolean

        keyword: string -> keyword search
        owned: boolean -> current use is author
        favourites: boolean -> is favourited by current user
        archived: boolean -> is in state 'archived'

        """
        # Start by creating keyword-based Q objects
        q_objects = Q()
        q_objects_project = Q()
        q_objects_workflow = Q()

        filter_kwargs = {}
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

        for filter_item in filters:
            name = filter_item.get("name")
            value = filter_item.get("value")

            # this is leaking the rest UI grouping back into the model
            # i don't think these should be all values of 'type'
            # we should get a flat list of a dict probably
            # ok for now, but more work should be done on abstracting this
            # again, wait for decision on search
            if name == "type":
                if value == "owned":
                    filter_kwargs["author_id"] = user.id
                # if name == 'shared':
                if value == "archived":
                    filter_kwargs["deleted"] = True
                # if value == 'favourited':
                #     filter_kwargs["favourited_by"] = user.id
                # Apply the favourite filter
                if value == "favourited":
                    project_favourite_subquery = self.get_favourite_subquery(
                        user, DAO.get_model_from_str("project")
                    )
                    workflow_favourite_subquery = self.get_favourite_subquery(
                        user, DAO.get_model_from_str("workflow")
                    )
                    q_objects_project &= project_favourite_subquery
                    q_objects_workflow &= workflow_favourite_subquery

            elif name == "workspaceType":
                filter_kwargs["annotated_type"] = value

            elif name == "published":
                filter_kwargs["published"] = value

            elif name == "isTemplate":
                filter_kwargs["is_template"] = True

            elif name == "keyword" and value is not None and value is not "":
                q_objects = self.build_keyword_filter(value)

            elif name == "discipline" and isinstance(value, list):
                # disciplines is on the Workspace abstract model
                # but we think it only applies to projects
                # this might be a problem
                # i.e. disciplines are not recorded on worklow
                # but the parent project disciplines are expected to show up there
                # and thus be filtered by it....
                # in which case we would do an additional dynamic query by parent project id
                q_objects_project &= Q(disciplines__id__in=value)
                q_objects_workflow &= Q(disciplines__id__in=value)

        # Query for "project" model
        project_queryset = (
            DAO.get_model_from_str("project")
            .objects.select_related("author")
            .annotate(annotated_type=Value("project", output_field=CharField()))
            .filter(**filter_kwargs)
            .filter(q_objects)
            .filter(q_objects_project)
            # this is for the 'relevance' query which we might leave turned off
            # .annotate(num_nodes=Count("workflows__weeks__nodes"))
            .only(*fields)
            .distinct()
        )

        # Query for "workflow" model
        workflow_queryset = (
            DAO.get_model_from_str("workflow")
            #            .objects.select_related("author", "favourited_by")
            .objects.select_related("author")
            .annotate(
                annotated_type=Case(
                    # Check if each subclass exists and return its 'type'
                    *[
                        When(**{f"{subclass}__isnull": False}, then=Value(subclass))
                        for subclass in SUBCLASSES
                    ],
                    # Default value if no subclass is found
                    default=Value("workflow"),
                    output_field=CharField(),
                )
            )
            .filter(**filter_kwargs)
            .filter(q_objects)
            .filter(q_objects_workflow)
            # this is for the 'relevance' query which we might leave turned off
            # .annotate(num_nodes=Count("weeks__nodes"))
            .only(*fields)
            .distinct()
        )

        # Combine the two querysets back with `union()` to get rid of the duplicated query instance from before
        queryset = project_queryset.union(workflow_queryset)

        return queryset

    @staticmethod
    def build_keyword_filter(keyword_string):
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

    @staticmethod
    def apply_sorting(queryset, sort):
        """
        Apply sorting to the queryset.
        """
        # Define a mapping of incoming sort values to actual DB fields
        sort_field_mapping = {
            "DATE_CREATED": "created_on",
            "A_Z": "title",
            "DATE_MODIFIED": "last_modified",  # Assuming this is the DB field for modified date
        }

        # Get the actual sort field from the map
        sort_field = sort_field_mapping.get(sort.get("value"), "created_on")
        direction = sort.get("direction", "ASC").upper()

        if sort_field == "relevance":
            # we don't have this enabled right now
            queryset = sorted(
                queryset,
                key=lambda x: Utility.get_relevance(x, sort.get("keywords", "")),
                reverse=(direction == "DESC"),
            )
        else:
            # Apply default sorting
            order_prefix = "-" if direction == "DESC" else ""
            queryset = queryset.order_by(f"{order_prefix}{sort_field}")

        return queryset

    @staticmethod
    def apply_pagination(queryset, pagination):
        pprint("pagination")
        pprint(pagination)
        """
        Apply pagination to the queryset.
        """
        page = pagination.get("page", 0)
        results_per_page = pagination.get("results_per_page", 10)
        total_results = queryset.count()

        start = max(page * results_per_page, 0)
        end = min((page + 1) * results_per_page, total_results)

        return_objects = list(queryset)[start:end]

        # Pagination meta
        page_number = math.ceil(total_results / results_per_page)
        return_pagination = {
            "total_results": total_results,
            "page_count": page_number,
            "current_page": page,
            "results_per_page": results_per_page,
        }

        return return_objects, return_pagination

    @staticmethod
    def get_favourite_subquery(user, model):
        model_type = ContentType.objects.get_for_model(model)
        return Exists(
            Favourite.objects.filter(
                object_id=OuterRef("pk"),
                content_type=model_type,
                user=user,
            )
        )

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


#########################################################
# maybe resurrect this for relevance...
#########################################################
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
