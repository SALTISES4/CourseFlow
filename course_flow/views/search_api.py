import json
import math

# import time
from functools import reduce
from itertools import chain
from operator import attrgetter

import bleach
import pandas as pd
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, ProtectedError, Q
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django.views.generic import DetailView, ListView, TemplateView
from django.views.generic.edit import CreateView, UpdateView
from rest_framework.generics import ListAPIView
from rest_framework.renderers import JSONRenderer

from course_flow import export_functions
from course_flow import redux_actions as actions
from course_flow import tasks
from course_flow.decorators import (
    ajax_login_required,
    check_object_enrollment,
    check_object_permission,
    from_same_workflow,
    public_model_access,
    user_can_comment,
    user_can_delete,
    user_can_edit,
    user_can_edit_or_none,
    user_can_view,
    user_can_view_or_enrolled_as_student,
    user_can_view_or_enrolled_as_teacher,
    user_can_view_or_none,
    user_enrolled_as_student,
    user_enrolled_as_teacher,
    user_is_author,
    user_is_teacher,
)
from course_flow.forms import RegistrationForm
from course_flow.models import (  # OutcomeProject,
    Activity,
    Column,
    ColumnWorkflow,
    Course,
    CourseFlowUser,
    Discipline,
    Favourite,
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    Node,
    NodeLink,
    NodeWeek,
    Notification,
    ObjectPermission,
    ObjectSet,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    User,
    UserAssignment,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
from course_flow.serializers import (  # OutcomeProjectSerializerShallow,
    ActivitySerializerShallow,
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    CommentSerializer,
    CourseSerializerShallow,
    DisciplineSerializer,
    InfoBoxSerializer,
    LinkedWorkflowSerializerShallow,
    LiveAssignmentSerializer,
    LiveAssignmentWithCompletionSerializer,
    LiveProjectSerializer,
    LiveProjectUserSerializer,
    LiveProjectUserSerializerWithCompletion,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    ObjectSetSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    ProjectSerializerShallow,
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    UserAssignmentSerializer,
    UserAssignmentSerializerWithUser,
    UserSerializer,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerForAssignments,
    WorkflowSerializerShallow,
    bleach_allowed_tags_description,
    bleach_allowed_tags_title,
    bleach_sanitizer,
    serializer_lookups_shallow,
)
from course_flow.utils import (  # dateTimeFormat,; get_parent_model,; get_parent_model_str,; get_unique_outcomehorizontallinks,; get_unique_outcomenodes,
    benchmark,
    check_possible_parent,
    dateTimeFormatNoSpace,
    get_all_outcomes_for_outcome,
    get_all_outcomes_for_workflow,
    get_descendant_outcomes,
    get_model_from_str,
    get_nondeleted_favourites,
    get_parent_nodes_for_workflow,
    get_relevance,
    get_user_permission,
    get_user_role,
    save_serializer,
)


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
    from_saltise = data.get("from_saltise", False)
    content_rich = data.get("content_rich", False)
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
