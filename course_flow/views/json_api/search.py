import json
import math

# import time
from functools import reduce
from itertools import chain
from operator import attrgetter

from django.db.models import Count, Q
from django.http import HttpRequest, JsonResponse

from course_flow.decorators import user_is_teacher
from course_flow.models import Project
from course_flow.models.objectPermission import ObjectPermission
from course_flow.serializers import InfoBoxSerializer
from course_flow.utils import get_model_from_str, get_relevance


@user_is_teacher()
def json_api_post_search_all_objects(request: HttpRequest) -> JsonResponse:
    name_filter = json.loads(request.POST.get("filter")).lower()
    data = json.loads(request.POST.get("additional_data", "{}"))
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

    return JsonResponse(
        {
            "action": "posted",
            "workflow_list": InfoBoxSerializer(
                return_objects, context={"user": request.user}, many=True
            ).data,
            "pages": pages,
        }
    )


#######################
# Helper Functions
#######################


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
