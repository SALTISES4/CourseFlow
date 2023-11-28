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
    make_user_notification,
    save_serializer,
)

#####################################################
# JSON API for all things sharing and notifications
#####################################################


# change permissions on an object for a user
@user_can_edit(False)
def json_api_post_set_permission(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    objectType = json.loads(request.POST.get("objectType"))
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    user_id = json.loads(request.POST.get("permission_user"))
    permission_type = json.loads(request.POST.get("permission_type"))
    response = {}
    try:
        user = User.objects.get(id=user_id)
        if (
            permission_type
            in [
                ObjectPermission.PERMISSION_EDIT,
                ObjectPermission.PERMISSION_VIEW,
                ObjectPermission.PERMISSION_COMMENT,
            ]
            and Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
            return JsonResponse(
                {"action": "error", "error": _("User is not a teacher.")}
            )
        item = get_model_from_str(objectType).objects.get(id=object_id)
        # if hasattr(item, "get_subclass"):
        #     item = item.get_subclass()

        project = item.get_project()
        if permission_type != ObjectPermission.PERMISSION_EDIT:
            if item.author == user or (
                project is not None and project.author == user
            ):
                response = JsonResponse(
                    {
                        "action": "error",
                        "error": _("This user's role cannot be changed."),
                    }
                )
                # response.status_code = 403
                return response

        # Not currently enabled
        if permission_type == ObjectPermission.PERMISSION_STUDENT:
            raise ValidationError
        #     if objectType == "project":
        #         if item.liveproject is None:
        #             return JsonResponse(
        #                 {
        #                     "action": "error",
        #                     "error": _(
        #                         "Cannot add a student to a non-live project."
        #                     ),
        #                 }
        #             )
        #     else:
        #         project = item.get_project()
        #         if project is None:
        #             return JsonResponse(
        #                 {
        #                     "action": "error",
        #                     "error": _(
        #                         "Cannot add a student to this workflow type."
        #                     ),
        #                 }
        #             )
        #         elif project.liveproject is None:
        #             return JsonResponse(
        #                 {
        #                     "action": "error",
        #                     "error": _(
        #                         "Cannot add a student to a non-live project."
        #                     ),
        #                 }
        #             )

        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if permission_type != ObjectPermission.PERMISSION_NONE:
            ObjectPermission.objects.create(
                user=user, content_object=item, permission_type=permission_type
            )
            make_user_notification(
                source_user=request.user,
                target_user=user,
                notification_type=Notification.TYPE_SHARED,
                content_object=item,
            )
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"

    return JsonResponse(response)


@user_can_view(False)
def json_api_post_get_users_for_object(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    if object_type in ["activity", "course", "program"]:
        object_type = "workflow"
    content_type = ContentType.objects.get(model=object_type)
    this_object = get_model_from_str(object_type).objects.get(id=object_id)
    published = this_object.published
    public_view = False
    if object_type == "workflow":
        public_view = this_object.public_view
    try:
        this_object = get_model_from_str(object_type).objects.get(id=object_id)
        cannot_change = []
        if this_object.author is not None:
            cannot_change = [this_object.author.id]
            author = UserSerializer(this_object.author).data
            if object_type == "workflow" and not this_object.is_strategy:
                cannot_change.append(this_object.get_project().author.id)
        else:
            author = None
        editors = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        ).select_related("user"):
            editors.add(object_permission.user)
        viewers = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        ).select_related("user"):
            viewers.add(object_permission.user)
        commentors = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_COMMENT,
        ).select_related("user"):
            commentors.add(object_permission.user)
        students = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_STUDENT,
        ).select_related("user"):
            students.add(object_permission.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "author": author,
            "viewers": UserSerializer(viewers, many=True).data,
            "commentors": UserSerializer(commentors, many=True).data,
            "editors": UserSerializer(editors, many=True).data,
            "students": UserSerializer(students, many=True).data,
            "published": published,
            "public_view": public_view,
            "cannot_change": cannot_change,
        }
    )


@user_is_teacher()
def json_api_post_get_user_list(request: HttpRequest) -> JsonResponse:
    name_filter = json.loads(request.POST.get("filter"))
    names = name_filter.split(" ")
    length = len(names)
    filters = [[name_filter, ""], ["", name_filter]]
    for i, name in enumerate(names):
        if i < length - 1:
            filters += [
                [" ".join(names[0 : i + 1]), " ".join(names[i + 1 : length])]
            ]
    try:
        q_objects = Q(username__istartswith=name_filter)
        for q_filter in filters:
            q_objects |= Q(
                first_name__istartswith=q_filter[0],
                last_name__istartswith=q_filter[1],
            )

        teacher_group = Group.objects.get(name=settings.TEACHER_GROUP)

        user_list = User.objects.filter(q_objects, groups=teacher_group)[:10]
        count = len(user_list)
        if count < 10:
            user_list = list(user_list)
            q_objects = Q(username__icontains=name_filter)
            for q_filter in filters:
                q_objects |= Q(
                    first_name__icontains=q_filter[0],
                    last_name__icontains=q_filter[1],
                )
            user_list += list(
                User.objects.filter(q_objects, groups=teacher_group).exclude(
                    id__in=[user.id for user in user_list]
                )[: 10 - count]
            )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "user_list": UserSerializer(user_list, many=True).data,
        }
    )


@ajax_login_required
@require_POST
def json_api_post_mark_all_as_read(request):
    request.user.notifications.filter(is_unread=True).update(is_unread=False)
    return JsonResponse({"action": "posted"})
