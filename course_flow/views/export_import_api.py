import json

# import time
from itertools import chain

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

######################################
# Export and import API, actual logic
# handled in import_functions.py and
# export_functions.py
######################################


@user_can_edit(False)
def json_api_post_import_data(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    task_type = request.POST.get("importType")
    file = request.FILES.get("myFile")
    try:
        if file.size < 1024 * 1024:
            file_type = file.content_type
            if file.name.endswith(".csv"):
                file_type = "text/csv"
            if (
                file_type
                == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                or file_type == "application/vnd.ms-excel"
            ):
                df = pd.read_excel(file, keep_default_na=False)
            elif file_type == "text/csv":
                df = pd.read_csv(file, keep_default_na=False)
            if len(df.index) > 1000:
                raise ValidationError
            tasks.async_import_file_data(
                object_id,
                object_type,
                task_type,
                df.to_json(),
                request.user.id,
            )
        else:
            return JsonResponse({"action": "error"})
    except Exception:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@user_can_view(False)
def json_api_post_get_export(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    export_type = request.POST.get("export_type")
    export_format = request.POST.get("export_format")
    allowed_sets = request.POST.getlist("object_sets[]", [])
    try:
        subject = _("Your CourseFlow Export")
        text = _("Hi there! Here are the results of your recent export.")
        tasks.async_send_export_email(
            request.user.email,
            object_id,
            object_type,
            export_type,
            export_format,
            allowed_sets,
            subject,
            text,
        )

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})
